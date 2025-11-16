
import { GoogleGenAI, Modality } from "@google/genai";

export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    if (!process.env.API_KEY) {
      throw new Error("API key is not configured.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say with a calm and clear tone: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              // 'Kore' is one of the available female voices.
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (typeof base64Audio === 'string') {
        return base64Audio;
    }
    
    return null;

  } catch (error) {
    console.error("Error generating speech:", error);
    throw new Error("Failed to generate audio from text.");
  }
};
