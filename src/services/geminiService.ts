import { GoogleGenAI, Type } from "@google/genai";
import type { Definition, TranslationResult } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  // This error will be thrown during local development if the .env file is missing.
  // In a production environment like Coolify, this variable must be set.
  throw new Error("VITE_GEMINI_API_KEY environment variable is not defined.");
}

const ai = new GoogleGenAI({ apiKey });

const wordWithReadingSchema = {
    type: Type.OBJECT,
    properties: {
        word: { type: Type.STRING, description: "A palavra, partícula ou frase." },
        reading: { type: Type.STRING, description: "A leitura fonética (furigana) do segmento. Se for um símbolo ou não tiver leitura, pode ser uma string vazia." }
    },
    required: ["word", "reading"]
};

const definitionSchema = {
  type: Type.OBJECT,
  properties: {
    word: {
      type: Type.STRING,
      description: "A palavra japonesa que está sendo definida, incluindo sua leitura em Hiragana ou Katakana se aplicável (ex: 日本(にほん))."
    },
    definition: {
      type: Type.ARRAY,
      description: "A definição completa, segmentada em palavras com suas leituras fonéticas.",
      items: wordWithReadingSchema
    },
    examples: {
      type: Type.ARRAY,
      description: "Duas ou três frases de exemplo, onde cada frase é segmentada em palavras com suas leituras.",
      items: {
        type: Type.ARRAY,
        items: wordWithReadingSchema
      }
    }
  },
  required: ["word", "definition", "examples"]
};

const translationSchema = {
    type: Type.OBJECT,
    properties: {
        definition: { type: Type.STRING, description: "The English translation of the main definition." },
        examples: {
            type: Type.ARRAY,
            description: "An array of English translations for the example sentences, in the same order as provided.",
            items: { type: Type.STRING }
        }
    },
    required: ["definition", "examples"]
};

export const fetchDefinition = async (word: string): Promise<Definition> => {
  const cacheKey = `definition_cache_${word}`;
  try {
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      console.log(`Serving definition for "${word}" from cache.`);
      return JSON.parse(cachedData);
    }
  } catch (error) {
    console.warn("Could not read from localStorage cache", error);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Define a palavra japonesa: ${word}`,
      config: {
        systemInstruction: "Você é um dicionário de japonês. Forneça definições claras e exemplos de frases para a palavra solicitada. Para a definição e para cada frase de exemplo, segmente o texto em palavras, partículas ou frases curtas e forneça a leitura fonética (furigana) para cada segmento. Palavras em katakana ou hiragana puro podem ter a leitura idêntica à palavra. Responda inteiramente em japonês e no formato JSON solicitado.",
        responseMimeType: "application/json",
        responseSchema: definitionSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);
    
    if (parsedJson && typeof parsedJson.word === 'string' && Array.isArray(parsedJson.definition) && Array.isArray(parsedJson.examples)) {
        try {
            localStorage.setItem(cacheKey, JSON.stringify(parsedJson));
        } catch (error) {
            console.warn("Could not write to localStorage cache", error);
        }
        return parsedJson as Definition;
    } else {
        throw new Error("A resposta da API não corresponde ao formato esperado.");
    }
    
  } catch (error) {
    console.error("Erro ao buscar definição:", error);
    let errorMessage = "Não foi possível buscar a definição. ";
    if (error instanceof Error) {
        errorMessage += error.message;
    }
    throw new Error(errorMessage);
  }
};

export const fetchTranslation = async (text: string): Promise<TranslationResult> => {
    const cacheKey = `translation_cache_${text}`;
    try {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
            console.log(`Serving translation for text from cache.`);
            return JSON.parse(cachedData);
        }
    } catch (error) {
        console.warn("Could not read from localStorage cache", error);
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Translate the following Japanese text to English. The text contains a main definition followed by example sentences separated by newlines. Provide the translation in the requested JSON format, with a key "definition" for the definition and "examples" for the array of example sentences.\n\nJapanese text:\n${text}`,
            config: {
                systemInstruction: "You are an expert translator specializing in Japanese to English translations. You always respond in the requested JSON format.",
                temperature: 0.3,
                responseMimeType: "application/json",
                responseSchema: translationSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);

        if (parsedJson && typeof parsedJson.definition === 'string' && Array.isArray(parsedJson.examples)) {
            try {
                localStorage.setItem(cacheKey, JSON.stringify(parsedJson));
            } catch (error) {
                console.warn("Could not write translation to localStorage cache", error);
            }
            return parsedJson as TranslationResult;
        } else {
             throw new Error("API response did not match the expected format.");
        }
    } catch (error) {
        console.error("Error fetching translation:", error);
        let errorMessage = "Could not fetch translation. ";
        if (error instanceof Error) {
            errorMessage += error.message;
        }
        throw new Error(errorMessage);
    }
};