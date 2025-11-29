
import { GoogleGenAI, Type } from "@google/genai";
import { WordEntry, GameTheme } from "../types";

const apiKey = process.env.API_KEY || ''; // Ensure API key is available
const ai = new GoogleGenAI({ apiKey });

const MODEL_NAME = 'gemini-2.5-flash';

// Helper to get the last letter
const getLastLetter = (word: string): string => {
  return word.charAt(word.length - 1).toLowerCase();
};

/**
 * Validates if a word is a valid Indonesian word AND fits the theme using Gemini.
 */
export const validateWordWithAI = async (word: string, theme: GameTheme): Promise<{ isValid: boolean; fitsTheme: boolean; message: string }> => {
  try {
    const themeContext = theme === GameTheme.ANY 
      ? "Tema adalah 'BEBAS', jadi semua kata benda/kerja/sifat valid asalkan baku."
      : `Tema adalah '${theme}'. Kata HARUS berhubungan erat dengan kategori ini.`;

    const prompt = `Validasi kata "${word}" dalam Bahasa Indonesia.
    1. Apakah kata ini ada di KBBI (Kamus Besar Bahasa Indonesia) dan baku?
    2. ${themeContext}
    
    Jawab dengan JSON.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN, description: "Benar jika kata tersebut valid dan baku dalam Bahasa Indonesia." },
            fitsTheme: { type: Type.BOOLEAN, description: "Benar jika kata tersebut sesuai dengan tema yang diminta. Jika tema Bebas, set true." },
            message: { type: Type.STRING, description: "Penjelasan singkat." }
          },
          required: ["isValid", "fitsTheme", "message"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return { isValid: false, fitsTheme: false, message: "Gagal memvalidasi kata." };
  } catch (error) {
    console.error("Error validating word:", error);
    // Fallback: assume valid if API fails
    return { isValid: true, fitsTheme: true, message: "Valid (Offline Check)" };
  }
};

/**
 * Generates the AI's next move based on history and theme.
 */
export const getAIMove = async (
  history: WordEntry[], 
  lastWord: string | null,
  theme: GameTheme
): Promise<{ word: string; surrender: boolean }> => {
  
  const usedWords = history.map(h => h.word).join(", ");
  const targetLetter = lastWord ? getLastLetter(lastWord) : ''; 

  const themeInstruction = theme === GameTheme.ANY
    ? "Bebas (kata apa saja yang valid)"
    : `Sesuai tema '${theme}'`;

  const prompt = lastWord 
    ? `Kita bermain sambung kata. Kata terakhir: "${lastWord}". 
       Cari satu kata Bahasa Indonesia yang dimulai huruf "${targetLetter}".
       Tema: ${themeInstruction}.
       Kata yang SUDAH digunakan: [${usedWords}].
       JANGAN gunakan kata yang sudah digunakan.
       Jika menyerah, set surrender true. Format JSON.`
    : `Mulai permainan sambung kata Bahasa Indonesia. Tema: ${themeInstruction}. Jawab JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        temperature: 0.7, 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING, description: "Kata balasan kamu." },
            surrender: { type: Type.BOOLEAN, description: "Set true jika tidak menemukan kata." }
          },
          required: ["word", "surrender"]
        }
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      return {
        word: result.word.toLowerCase().trim(),
        surrender: result.surrender || false
      };
    }
    return { word: '', surrender: true };
  } catch (error) {
    console.error("Error getting AI move:", error);
    return { word: '', surrender: true };
  }
};
