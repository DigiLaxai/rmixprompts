import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { PromptInput } from './components/PromptInput';
import { Spinner } from './components/Spinner';
import { Footer } from './components/Footer';
import { HistorySidebar } from './components/HistorySidebar';
import { generatePromptFromImage, generateImageFromPrompt } from './services/geminiService';
import { ErrorBanner } from './components/ErrorBanner';
import { HistoryItem, getHistory, saveHistory } from './utils/history';
import { CopyIcon } from './components/icons/CopyIcon';
import { CheckIcon } from './components/icons/CheckIcon';
import { WandIcon } from './components/icons/WandIcon';
import { GeneratedImageModal } from './components/GeneratedImageModal';
import { KeyIcon } from './components/icons/KeyIcon';

type Stage = 'UPLOADING' | 'PROMPTING';

const ART_STYLES = ['Photorealistic', 'Illustration', 'Anime', 'Oil Painting', 'Pixel Art', 'None'];

const getStyleSuffix = (style: string): string => {
  if (!style || style === 'None') {
    return '';
  }
  return `, in the style of ${style.toLowerCase()}`;
};

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(() => sessionStorage.getItem('gemini-api-key'));
  const [apiKeyInput, setApiKeyInput] = useState('');

  const [uploadedImage, setUploadedImage] = useState<{ data: string; mimeType: string; } | null>(null);
  const [stage, setStage] = useState<Stage>('UPLOADING');
  const [editablePrompt, setEditablePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(ART_STYLES[0]);
  
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<{ data: string; mimeType: string; } | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleApiKeySave = () => {
    if (apiKeyInput.trim()) {
      sessionStorage.setItem('gemini-api-key', apiKeyInput.trim());
      setApiKey(apiKeyInput.trim());
      setApiKeyInput('');
    }
  };

  const handleApiKeyReset = () => {
    if (window.confirm('Are you sure you want to reset your API key?')) {
      sessionStorage.removeItem('gemini-api-key');
      setApiKey(null);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setUploadedImage({ data: base64String, mimeType: file.type });
        setStage('UPLOADING'); // Reset stage if a new image is uploaded
        setEditablePrompt('');
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = () => {
    setUploadedImage(null);
    setEditablePrompt('');
    setStage('UPLOADING');
    setError(null);
  };
  
  const handleCreatePrompt = useCallback(async () => {
    if (!uploadedImage) return;

    setIsLoadingPrompt(true);
    setError(null);
    try {
      const prompt = await generatePromptFromImage(uploadedImage);
      const defaultStyle = ART_STYLES[0];
      
      setEditablePrompt(prompt + getStyleSuffix(defaultStyle));
      setSelectedStyle(defaultStyle);
      
      const newHistoryItem: HistoryItem = {
        id: Date.now(),
        uploadedImage: uploadedImage,
        basePrompt: prompt,
        selectedStyle: defaultStyle,
      };
      const updatedHistory = [newHistoryItem, ...history.slice(0, 19)];
      setHistory(updatedHistory);
      saveHistory(updatedHistory);

      setStage('PROMPTING');
    } catch (err: any) {
      setError(err.message || 'Failed to generate prompt from image.');
      setStage('UPLOADING');
    } finally {
      setIsLoadingPrompt(false);
    }
  }, [uploadedImage, history]);

  const handleStyleChange = (newStyle: string) => {
    const oldSuffix = getStyleSuffix(selectedStyle);
    const newSuffix = getStyleSuffix(newStyle);

    let currentBase = editablePrompt;
    if (oldSuffix && editablePrompt.endsWith(oldSuffix)) {
        currentBase = editablePrompt.slice(0, editablePrompt.length - oldSuffix.length);
    }
    
    setEditablePrompt(currentBase + newSuffix);
    setSelectedStyle(newStyle);
  };

  const handleStartOver = () => {
    setUploadedImage(null);
    setEditablePrompt('');
    setSelectedStyle(ART_STYLES[0]);
    setStage('UPLOADING');
    setError(null);
  };

  const loadFromHistory = (item: HistoryItem) => {
    setUploadedImage(item.uploadedImage);
    setSelectedStyle(item.selectedStyle);
    setEditablePrompt(item.basePrompt + getStyleSuffix(item.selectedStyle));
    setStage('PROMPTING');
    setIsHistoryOpen(false);
    setError(null);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history? This cannot be undone.')) {
        setHistory([]);
        saveHistory([]);
    }
  };

  const handleCopy = useCallback(() => {
    if (!editablePrompt) return;
    navigator.clipboard.writeText(editablePrompt).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  }, [editablePrompt]);
  
  const handleGenerateImage = async () => {
    if (!editablePrompt.trim()) return;

    setIsGeneratingImage(true);
    setError(null);
    try {
      const image = await generateImageFromPrompt(editablePrompt);
      setGeneratedImage(image);
      setIsImageModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to generate image.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleClearError = () => setError(null);

  return (
    <div className="bg-slate-900 text-white min-h-screen font-sans flex flex-col">
      <Header onHistoryClick={() => setIsHistoryOpen(true)} onResetApiKey={handleApiKeyReset} />
      
      <HistorySidebar 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onLoad={loadFromHistory}
        onClear={handleClearHistory}
      />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <div className="max-w-3xl mx-auto">
          {!apiKey ? (
            <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-yellow-500/50 text-center">
              <KeyIcon className="mx-auto h-12 w-12 text-yellow-500" />
              <h2 className="text-xl font-semibold mt-4 mb-2 text-slate-200">Set Your API Key</h2>
              <p className="text-slate-400 mb-4 max-w-md mx-auto">To use this app, please enter your Google AI API key. It will be stored securely in your browser for this session only.</p>
              <div className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
                  <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleApiKeySave()}
                      placeholder="Enter your Google AI API Key"
                      className="flex-grow bg-slate-900 border border-slate-600 rounded-lg p-3 text-slate-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-shadow"
                  />
                  <button
                      onClick={handleApiKeySave}
                      className="bg-yellow-500 text-slate-900 font-bold py-3 px-6 rounded-lg hover:bg-yellow-400 transition-colors"
                  >
                      Save Key
                  </button>
              </div>
              <p className="text-xs text-slate-500 mt-3 flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-400">
                      Get a key from Google AI Studio
                  </a>
                  <span className="hidden sm:inline">or</span>
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-400">
                      Use a key from Google Cloud
                  </a>
              </p>
            </div>
          ) : (
            <>
              {error && (
                <ErrorBanner message={error} onDismiss={handleClearError} />
              )}
              
              {stage === 'UPLOADING' && (
                <PromptInput
                  image={uploadedImage}
                  onImageChange={handleImageChange}
                  onImageRemove={handleImageRemove}
                  onCreatePrompt={handleCreatePrompt}
                  isLoading={isLoadingPrompt}
                />
              )}

              {isLoadingPrompt && <Spinner />}
              
              {stage === 'PROMPTING' && uploadedImage && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-slate-300">1. Your Image</h2>
                    <img 
                      src={`data:${uploadedImage.mimeType};base64,${uploadedImage.data}`} 
                      alt="Uploaded content" 
                      className="rounded-xl shadow-lg border-2 border-slate-700 w-full max-w-sm mx-auto"
                    />
                  </div>

                  <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700">
                    <label className="block text-lg font-semibold text-slate-300 mb-3">
                      2. Choose an Artistic Style
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {ART_STYLES.map(style => (
                        <button
                          key={style}
                          onClick={() => handleStyleChange(style)}
                          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
                            selectedStyle === style
                              ? 'bg-yellow-500 text-slate-900 shadow-md'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700">
                    <label htmlFor="prompt-editor" className="block text-lg font-semibold text-slate-300 mb-3">
                      3. Your Generated Prompt
                    </label>
                    <textarea
                      id="prompt-editor"
                      rows={6}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg p-4 text-slate-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-shadow resize-y"
                      value={editablePrompt}
                      onChange={(e) => setEditablePrompt(e.target.value)}
                      placeholder="Describe your vision..."
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={handleStartOver}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-700 text-slate-200 font-bold py-3 px-6 rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      Start Over
                    </button>
                    <button
                      onClick={handleCopy}
                      disabled={!editablePrompt.trim()}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-600 text-slate-200 font-bold py-3 px-4 rounded-lg hover:bg-slate-500 disabled:bg-slate-800 disabled:cursor-not-allowed disabled:text-slate-500 transition-all"
                    >
                      {isCopied ? (
                        <>
                          <CheckIcon className="w-5 h-5" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <CopyIcon className="w-5 h-5" />
                          Copy
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleGenerateImage}
                      disabled={!editablePrompt.trim() || isGeneratingImage}
                      className="w-full sm:flex-grow flex items-center justify-center gap-2 bg-yellow-500 text-slate-900 font-bold py-3 px-4 rounded-lg hover:bg-yellow-400 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-400 transition-all duration-300 ease-in-out"
                    >
                      {isGeneratingImage ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                          </>
                      ) : (
                        <>
                          <WandIcon className="w-5 h-5" />
                          Generate Image
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
      {isImageModalOpen && generatedImage && (
        <GeneratedImageModal 
          image={generatedImage} 
          prompt={editablePrompt} 
          onClose={() => setIsImageModalOpen(false)}
        />
      )}

      <Footer />
    </div>
  );
};

export default App;