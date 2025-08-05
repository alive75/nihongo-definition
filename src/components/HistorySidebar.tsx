import React from 'react';
import { BookOpenIcon, TrashIcon, XIcon } from './Icons';

interface HistorySidebarProps {
    history: string[];
    onHistoryClick: (term: string) => void;
    isLoading: boolean;
    onDeleteHistory: (term: string) => void;
    isOpen: boolean;
    onClose: () => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ history, onHistoryClick, isLoading, onDeleteHistory, isOpen, onClose }) => {
    return (
        <>
            {/* Backdrop for mobile */}
            <div
                className={`fixed inset-0 bg-black/60 z-30 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            />

            <aside
                id="history-sidebar"
                className={`bg-slate-950 text-slate-200 p-6 flex flex-col transition-transform duration-300 ease-in-out
                    w-80 fixed top-0 left-0 h-full z-40 
                    md:w-64 md:relative md:flex-shrink-0 md:translate-x-0
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
                aria-label="検索履歴"
            >
                <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-2">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <BookOpenIcon className="w-7 h-7" />
                        検索履歴
                    </h2>
                    <button
                        onClick={onClose}
                        className="md:hidden p-1 text-slate-400 hover:text-white"
                        aria-label="履歴を閉じる"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

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
                                        onClick={(e) => { e.stopPropagation(); onDeleteHistory(item); }}
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
        </>
    );
};

export default HistorySidebar;

