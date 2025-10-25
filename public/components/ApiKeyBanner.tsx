
import React, { useState } from 'react';
import { KeyIcon } from './icons/KeyIcon';

interface ApiKeyBannerProps {
  onSave: (apiKey: string) => void;
}

export const ApiKeyBanner: React.FC<ApiKeyBannerProps> = ({ onSave }) => {
  const [key, setKey] = useState('');

  const handleSaveClick = () => {
    if (key.trim()) {
      onSave(key.trim());
    }
  };

  return (
    <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 px-4 py-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <KeyIcon className="w-6 h-6 flex-shrink-0 text-yellow-400" />
        <div className="text-sm font-medium">
          <p>Please enter your Google Gemini API Key to use the app.</p>
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-300">
            Get your API Key from Google AI Studio.
          </a>
        </div>
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Enter your API Key"
          className="flex-grow sm:w-64 bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-slate-100 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
        />
        <button
          onClick={handleSaveClick}
          disabled={!key.trim()}
          className="bg-yellow-500 text-slate-900 font-bold py-2 px-4 rounded-md hover:bg-yellow-400 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
};