import React, { useState, useEffect, useCallback } from 'react';
import HistorySidebar from './components/HistorySidebar';
import SearchBar from './components/SearchBar';
import DefinitionCard from './components/DefinitionCard';
import { fetchDefinition } from './services/geminiService';
import type { DefinitionEntry, DisplayEntry, LoadingEntry } from './types';
import { SearchIcon } from './components/Icons';

const LoadingCard: React.FC = () => (
    <div className="flex items-center justify-center p-8 text-slate-400 bg-slate-800 rounded-xl shadow-lg border border-slate-700 animate-fade-in">
        <svg className="animate-spin h-6 w-6 text-purple-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-md">読み込み中...</p>
    </div>
);


const App: React.FC = () => {
  const [definitions, setDefinitions] = useState<DisplayEntry[]>(() => {
    try {
      const savedDefs = localStorage.getItem('nihongo_app_definitions');
      // All saved defs are of type DefinitionEntry, so we can cast
      return savedDefs ? JSON.parse(savedDefs) : [];
    } catch (error) {
      console.error("Failed to load definitions from localStorage", error);
      return [];
    }
  });

  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const savedHistory = localStorage.getItem('nihongo_app_searchHistory');
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (error) {
      console.error("Failed to load history from localStorage", error);
      return [];
    }
  });

  const [historySnapshots, setHistorySnapshots] = useState<Record<string, DefinitionEntry[]>>(() => {
    try {
      const savedSnapshots = localStorage.getItem('nihongo_app_snapshots');
      return savedSnapshots ? JSON.parse(savedSnapshots) : {};
    } catch (error) {
      console.error("Failed to load history snapshots from localStorage", error);
      return {};
    }
  });

  const [currentRootSearch, setCurrentRootSearch] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const definitionsToSave = definitions.filter(d => d.type === 'definition');
      if (definitionsToSave.length > 0 || definitions.length === 0) {
         localStorage.setItem('nihongo_app_definitions', JSON.stringify(definitionsToSave));
      }
    } catch (error) {
      console.error("Failed to save definitions to localStorage", error);
    }
  }, [definitions]);

  useEffect(() => {
    try {
      localStorage.setItem('nihongo_app_searchHistory', JSON.stringify(searchHistory));
    } catch (error) {
      console.error("Failed to save history to localStorage", error);
    }
  }, [searchHistory]);
  
  useEffect(() => {
    try {
      localStorage.setItem('nihongo_app_snapshots', JSON.stringify(historySnapshots));
    } catch (error) {
      console.error("Failed to save snapshots to localStorage", error);
    }
  }, [historySnapshots]);
  
  useEffect(() => {
    if (definitions.length > 0) {
        const rootDef = definitions.find(d => d.level === 0);
        if (rootDef && rootDef.type === 'definition') {
            const idParts = rootDef.id.split('-');
            idParts.pop();
            const rootTerm = idParts.join('-');
            
            setCurrentRootSearch(rootTerm);
            
            const definitionsToSave = definitions.filter(d => d.type === 'definition') as DefinitionEntry[];
            setHistorySnapshots(prev => ({...prev, [rootTerm]: definitionsToSave}));
        }
    } else {
        setCurrentRootSearch(null);
    }
  }, [definitions]);

  const handleRootSearch = async (term: string) => {
    setDefinitions([]); 
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchDefinition(term);
      const newDefinition: DefinitionEntry = {
        type: 'definition',
        id: `${term}-${Date.now()}`,
        data,
        isCollapsible: false,
        level: 0,
      };
      setDefinitions([newDefinition]);
      
      if (!searchHistory.includes(term)) {
        setSearchHistory(prev => [term, ...prev]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setDefinitions([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubSearch = async (term: string, level: number, loadingId: string) => {
    try {
        const data = await fetchDefinition(term);
        const newDefinition: DefinitionEntry = {
            type: 'definition',
            id: `${term}-${Date.now()}`,
            data,
            isCollapsible: true,
            level: level,
        };
        setDefinitions(prev => prev.map(d => d.id === loadingId ? newDefinition : d));
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        // Remove the loader on error
        setDefinitions(prev => prev.filter(def => def.id !== loadingId));
    }
  };

  const handleWordClick = (word: string, parentId: string, parentLevel: number) => {
      const loadingId = `loading-${word}-${Date.now()}`;
      const newLevel = parentLevel + 1;

      setDefinitions(prev => {
        const parentIndex = prev.findIndex(def => def.id === parentId);
        if (parentIndex < 0) return prev;

        const parentLevel = prev[parentIndex].level;
        let insertionIndex = parentIndex + 1;
        while(insertionIndex < prev.length && prev[insertionIndex].level > parentLevel) {
            insertionIndex++;
        }

        const newDefs = [...prev];
        const loadingEntry: LoadingEntry = { type: 'loading', id: loadingId, level: newLevel };
        newDefs.splice(insertionIndex, 0, loadingEntry);
        return newDefs;
      });

      handleSubSearch(word, newLevel, loadingId);
  };
  
  const handleHistoryClick = (term: string) => {
    const snapshot = historySnapshots[term];
    if (snapshot && snapshot.length > 0) {
        setDefinitions(snapshot);
    } else {
        handleRootSearch(term);
    }
  };

  const handleDeleteHistory = (termToDelete: string) => {
    setSearchHistory(prev => prev.filter(item => item !== termToDelete));

    setHistorySnapshots(prev => {
      const newSnapshots = { ...prev };
      delete newSnapshots[termToDelete];
      return newSnapshots;
    });

    try {
      localStorage.removeItem(`definition_cache_${termToDelete}`);
      localStorage.removeItem(`translation_cache_${termToDelete}`);
    } catch (e) {
      console.error(`Failed to remove cache for ${termToDelete} from localStorage.`, e);
    }

    if (currentRootSearch === termToDelete) {
      setDefinitions([]);
    }
  };

  const handleCloseDefinition = (idToRemove: string) => {
    setDefinitions(prev => {
      const defToRemoveIndex = prev.findIndex(def => def.id === idToRemove);
      if (defToRemoveIndex === -1) {
        return prev;
      }
  
      const defToRemoveLevel = prev[defToRemoveIndex].level;
  
      if (defToRemoveLevel === 0) {
        return [];
      }
      
      let endIndex = defToRemoveIndex + 1;
      while (endIndex < prev.length && prev[endIndex].level > defToRemoveLevel) {
        endIndex++;
      }
  
      const newDefs = [
        ...prev.slice(0, defToRemoveIndex),
        ...prev.slice(endIndex)
      ];
      
      return newDefs;
    });
  };

  return (
    <div className="flex h-screen bg-slate-900 font-sans">
      <HistorySidebar history={searchHistory} onHistoryClick={handleHistoryClick} isLoading={isLoading} onDeleteHistory={handleDeleteHistory} />
      
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="sticky top-0 z-10 p-6 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700">
          <SearchBar onSearch={handleRootSearch} isLoading={isLoading} />
        </header>

        <div className="p-6 md:p-8 flex-grow">
          {isLoading && definitions.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <svg className="animate-spin h-10 w-10 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-lg">定義を検索中...</p>
             </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
                <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative max-w-lg text-center" role="alert">
                    <strong className="font-bold">エラー!</strong>
                    <span className="block sm:inline ml-2">{error}</span>
                </div>
            </div>
          )}
          
          {!isLoading && !error && definitions.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <div className="text-center">
                    <SearchIcon className="w-24 h-24 mx-auto text-slate-700"/>
                    <h2 className="mt-4 text-2xl font-semibold text-slate-400">日本語定義</h2>
                    <p className="mt-2 text-lg">検索バーを使って、単語の定義を調べてみましょう。</p>
                </div>
            </div>
          )}
          
          <div className="space-y-6 max-w-4xl mx-auto">
            {definitions.map((entry) => (
              <div key={entry.id} style={{ marginLeft: `${entry.level * 2.5}rem` }} className="transition-all duration-300">
                {entry.type === 'definition' ? (
                  <DefinitionCard
                    id={entry.id}
                    definition={entry.data} 
                    isCollapsible={entry.isCollapsible} 
                    onWordClick={handleWordClick}
                    level={entry.level}
                    onClose={() => handleCloseDefinition(entry.id)}
                  />
                ) : (
                  <LoadingCard />
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
