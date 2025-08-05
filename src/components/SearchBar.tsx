import React, { useState } from 'react';
import { SearchIcon } from './Icons';

interface SearchBarProps {
    onSearch: (term: string) => void;
    isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
    const [term, setTerm] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (term.trim() && !isLoading) {
            onSearch(term.trim());
            setTerm('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex w-full max-w-2xl mx-auto">
            <input
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="言葉を入力してください (ex: 猫)"
                className="flex-grow p-3 sm:p-4 text-base sm:text-lg text-slate-100 placeholder:text-slate-500 bg-slate-800 border border-r-0 border-slate-700 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow"
                disabled={isLoading}
            />
            <button
                type="submit"
                className="flex items-center justify-center px-4 sm:px-6 bg-purple-600 text-white rounded-r-lg hover:bg-purple-700 disabled:bg-purple-800 disabled:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isLoading}
            >
                <SearchIcon className="w-6 h-6" />
            </button>
        </form>
    );
};

export default SearchBar;

