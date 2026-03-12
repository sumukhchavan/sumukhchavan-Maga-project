import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const getChatResponse = async (message: string, history: any[] = []) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        ...history,
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: "You are Daksh-AI, the assistant for Daksh-Bharat, a rural labor exchange platform in India. You help workers build profiles and employers find verified talent. Be helpful, professional, and culturally aware of rural Indian contexts. Use simple language.",
      }
    });
    return response.text;
  } catch (error) {
    console.error("Chat AI Error:", error);
    return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
  }
};

export const getQuickAdvice = async (skill: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: `Give 3 quick tips for a ${skill} in rural India to increase their earnings. Keep it very short.`,
    });
    return response.text;
  } catch (error) {
    console.error("Quick AI Error:", error);
    return null;
  }
};

export const findNearbyPlaces = async (query: string, lat: number, lng: number) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: query,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        }
      }
    });
    return {
      text: response.text,
      places: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Maps Grounding Error:", error);
    return null;
  }
};
