'use client';

import React from 'react';
import { Sparkles, Zap, Rocket, ChevronDown } from 'lucide-react';

export type OpenAIModel = 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4-turbo' | 'gpt-3.5-turbo';

interface ModelOption {
  value: OpenAIModel;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const modelOptions: ModelOption[] = [
  {
    value: 'gpt-4o-mini',
    label: 'GPT-4o Mini',
    icon: <Zap className="w-4 h-4" />,
    description: 'Fast & Affordable',
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    value: 'gpt-4o',
    label: 'GPT-4o',
    icon: <Sparkles className="w-4 h-4" />,
    description: 'Most Capable',
    color: 'text-purple-600 dark:text-purple-400',
  },
  {
    value: 'gpt-4-turbo',
    label: 'GPT-4 Turbo',
    icon: <Rocket className="w-4 h-4" />,
    description: 'Fast & Powerful',
    color: 'text-green-600 dark:text-green-400',
  },
  {
    value: 'gpt-3.5-turbo',
    label: 'GPT-3.5 Turbo',
    icon: <Zap className="w-4 h-4" />,
    description: 'Quick Responses',
    color: 'text-gray-600 dark:text-gray-400',
  },
];

interface ModelSelectorProps {
  selectedModel: OpenAIModel;
  onModelChange: (model: OpenAIModel) => void;
}

export default function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const currentModel = modelOptions.find((m) => m.value === selectedModel) || modelOptions[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all duration-300 transform hover:scale-105"
      >
        <span className={currentModel.color}>{currentModel.icon}</span>
        <div className="text-left">
          <div className="text-xs font-bold text-gray-900 dark:text-white">
            {currentModel.label}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
            {currentModel.description}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10 backdrop-blur-sm bg-black/10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full mt-3 right-0 w-80 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-20 animate-slide-in overflow-hidden">
            <div className="p-3">
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase px-3 py-2 tracking-wider">
                Select OpenAI Model
              </div>
              {modelOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onModelChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                    selectedModel === option.value
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-2 border-blue-500 dark:border-blue-400 shadow-md'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 border-2 border-transparent'
                  }`}
                >
                  <span className={option.color}>{option.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {option.label}
                      </span>
                      {option.value === 'gpt-4o-mini' && (
                        <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-semibold shadow-sm">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">
                      {option.description}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono">
                      {option.value}
                    </div>
                  </div>
                  {selectedModel === option.value && (
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mt-1.5 shadow-lg animate-pulse" />
                  )}
                </button>
              ))}
            </div>

            <div className="border-t-2 border-gray-200 dark:border-gray-700 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900/50 dark:to-blue-900/20">
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
                <p className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span><strong className="text-gray-800 dark:text-gray-200">GPT-4o Mini:</strong> Best for most queries (recommended)</span>
                </p>
                <p className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span><strong className="text-gray-800 dark:text-gray-200">GPT-4o:</strong> Most advanced reasoning & analysis</span>
                </p>
                <p className="flex items-start gap-2">
                  <Rocket className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span><strong className="text-gray-800 dark:text-gray-200">GPT-4 Turbo:</strong> Fast & powerful responses</span>
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
