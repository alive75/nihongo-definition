import React, { useState } from 'react';
import type { Definition, WordWithReading, TranslationResult } from '../types';
import { ChevronUpIcon, ChevronDownIcon, TranslateIcon, SpinnerIcon, XIcon } from './Icons';
import { fetchTranslation } from '../services/geminiService';

interface DefinitionCardProps {
  id: string;
  definition: Definition;
  isCollapsible: boolean;
  onWordClick: (word: string, parentId: string, parentLevel: number) => void;
  level: number;
  onClose: () => void;
}

const FuriganaText: React.FC<{ content: WordWithReading[]; onWordClick: (word: string) => void }> = ({ content, onWordClick }) => {
  return (
    <p className="text-xl leading-loose text-slate-300">
      {content.map((segment, index) => {
        const isPunctuation = '、。「」'.includes(segment.word) || /^\s*$/.test(segment.word);
        return (
          <ruby
            key={`${segment.word}-${index}`}
            onClick={() => !isPunctuation && onWordClick(segment.word)}
            className={`transition-colors p-0.5 ${isPunctuation ? 'cursor-default' : 'cursor-pointer hover:bg-purple-500/20 rounded'}`}
            style={{ rubyPosition: 'over' }}
          >
            {segment.word}
            <rt>{segment.reading}</rt>
          </ruby>
        );
      })}
    </p>
  );
};

const DefinitionCard: React.FC<DefinitionCardProps> = ({ id, definition, isCollapsible, onWordClick, level, onClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [showTranslation, setShowTranslation] = useState<boolean>(false);

  const handleTranslate = async () => {
    if (translation) {
      setShowTranslation(!showTranslation);
      return;
    }

    setIsTranslating(true);
    setTranslationError(null);
    try {
      const definitionText = definition.definition.map(s => s.word).join('');
      const examplesText = definition.examples
        .map(example => example.map(s => s.word).join(''))
        .join('\n');
      
      const textToTranslate = `${definitionText}\n${examplesText}`.trim();

      const result = await fetchTranslation(textToTranslate);
      setTranslation(result);
      setShowTranslation(true);
    } catch (err) {
      setTranslationError(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  const cardContent = (
    <>
      <div className="mt-4">
        <h3 className="text-lg font-semibold text-slate-400 mb-2 border-b border-slate-600 pb-1">定義</h3>
        <FuriganaText content={definition.definition} onWordClick={(word) => onWordClick(word, id, level)} />
      </div>

      {definition.examples && definition.examples.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-slate-400 mb-2 border-b border-slate-600 pb-1">例文</h3>
          <ul className="space-y-4">
            {definition.examples.map((example, index) => (
              <li key={index}>
                <FuriganaText content={example} onWordClick={(word) => onWordClick(word, id, level)} />
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mt-6 pt-4 border-t border-slate-700">
        <button
          onClick={handleTranslate}
          disabled={isTranslating}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-400 border border-purple-400/50 rounded-lg hover:bg-purple-500/10 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-wait transition-colors"
        >
          {isTranslating ? (
            <SpinnerIcon className="w-5 h-5" />
          ) : (
            <TranslateIcon className="w-5 h-5" />
          )}
          {isTranslating ? 'Translating...' : (showTranslation ? 'Hide Translation' : 'Translate to English')}
        </button>

        {showTranslation && (
          <div className="mt-4 bg-slate-900 p-4 rounded-lg border border-slate-700 animate-fade-in font-mono text-sm">
            {translationError ? (
              <p className="text-red-400">{translationError}</p>
            ) : (
              translation && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Definition</h4>
                    <p className="text-slate-200">{translation.definition}</p>
                  </div>
                  {translation.examples.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Example Sentences</h4>
                      <ul className="space-y-2">
                        {translation.examples.map((ex, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2 text-slate-500">&bull;</span>
                            <span className="flex-1 text-slate-200">{ex}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="bg-slate-800 rounded-xl shadow-lg p-4 md:p-6 border border-slate-700 animate-fade-in relative">
       {isCollapsible && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-lg text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors z-10"
          aria-label="Fechar definição"
        >
          <XIcon className="w-5 h-5" />
        </button>
       )}

      <div className="flex items-center pr-10">
        {isCollapsible && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg hover:bg-slate-700 transition-colors flex-shrink-0 mr-4"
            aria-label={isCollapsed ? "Expandir definição" : "Recolher definição"}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? <ChevronDownIcon className="w-7 h-7 text-slate-400" /> : <ChevronUpIcon className="w-7 h-7 text-slate-400" />}
          </button>
        )}
        <h1 className={`font-bold text-slate-100 transition-all duration-300 ${isCollapsed && isCollapsible ? 'text-2xl md:text-3xl' : 'text-4xl md:text-5xl'}`}>
          {definition.word}
        </h1>
      </div>
      
      {isCollapsible ? (
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0' : 'max-h-[2000px] mt-4'}`}>
          {cardContent}
        </div>
      ) : (
        cardContent
      )}
    </div>
  );
};

export default DefinitionCard;