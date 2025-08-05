export interface WordWithReading {
  word: string;
  reading: string;
}

export interface Definition {
  word: string;
  definition: WordWithReading[];
  examples: WordWithReading[][];
}

export interface TranslationResult {
  definition: string;
  examples: string[];
}

export interface DefinitionEntry {
  type: 'definition';
  id: string;
  data: Definition;
  isCollapsible: boolean;
  level: number;
}

export interface LoadingEntry {
  type: 'loading';
  id: string;
  level: number;
}

export type DisplayEntry = DefinitionEntry | LoadingEntry;