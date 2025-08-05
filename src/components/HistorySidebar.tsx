import React from 'react';
import { BookOpenIcon, TrashIcon } from './Icons';

interface HistorySidebarProps {
  history: string[];
  onHistoryClick: (term: string) => void;
  isLoading: boolean;
  onDeleteHistory: (term: string) => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ history, onHistoryClick, isLoading, onDeleteHistory }) => {
  return (
    <aside className="w-64 bg-slate-950 text-slate-200 p-6 flex flex-col">
      <h2 className="text-2xl font-bold mb-6 border-b border-slate-700 pb-2 flex items-center gap-2">
        <BookOpenIcon className="w-7 h-7" />
        検索履歴
      </h2>
      {history.length === 0 ? (
        <p className="text-slate-400 text-sm">まだ検索履歴がありません。</p>
      ) : (
        <ul className="flex-grow overflow-y-auto pr-2 -mr-4">
          {history.map((item) => (
            <li key={item} className="mb-2 group">
              <div className="flex items-center justify-between w-full text-left rounded-md hover:bg-slate-700 focus-within:bg-slate-700 transition-colors">
                <button
                  onClick={() => onHistoryClick(item)}
                  disabled={isLoading}
                  className="flex-grow text-left px-3 py-2 text-lg disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  {item}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteHistory(item);
                  }}
                  disabled={isLoading}
                  className="p-2 mr-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  aria-label={`「${item}」を履歴から削除`}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
};

export default HistorySidebar;