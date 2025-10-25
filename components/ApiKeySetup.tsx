import React, { useState } from 'react';
import { KeyIcon } from './icons/KeyIcon';

interface ApiKeySetupProps {
  onSave: (apiKey: string) => void;
}

export const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onSave }) => {
  const [key, setKey] = useState('');

  const handleSaveClick = () => {
    if (key.trim()) {
      onSave(key.trim());
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && key.trim()) {
      handleSaveClick();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md mx-auto bg-slate-800/50 p-8 rounded-xl shadow-lg border border-slate-700 text-center">
        <KeyIcon className="mx-auto h-12 w-12 text-yellow-400 mb-4" />
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Welcome to PromptCraft</h2>
        <p className="text-slate-400 mb-6">
          Please enter your Google Gemini API Key to begin.
        </p>
        <div className="flex flex-col gap-4">
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your API Key here"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-shadow"
              aria-label="Gemini API Key"
            />
            <button
              onClick={handleSaveClick}
              disabled={!key.trim()}
              className="w-full bg-yellow-500 text-slate-900 font-bold py-3 px-4 rounded-lg hover:bg-yellow-400 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-400 transition-colors"
            >
              Continue
            </button>
        </div>
         <p className="text-xs text-slate-500 mt-6">
            You can get your API Key from{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-400">
                Google AI Studio
            </a>.
        </p>
      </div>
    </div>
  );
};
