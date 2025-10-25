import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Modality } from "@google/genai";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests allowed' });
  }

  try {
    const { prompt } = request.body;
    if (!prompt) {
        return response.status(400).json({ error: 'A text prompt is required.' });
    }

    if (!process.env.API_KEY) {
        return response.status(500).json({ error: 'API key is not configured.' });
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const genAIResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [{ text: prompt }],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of genAIResponse.candidates[0].content.parts) {
        if (part.inlineData) {
            const image = {
                data: part.inlineData.data,
                mimeType: part.inlineData.mimeType,
            };
            return response.status(200).json({ image });
        }
    }
    
    return response.status(500).json({ error: 'Image generation failed. No image data received.' });

  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return response.status(500).json({ error: errorMessage });
  }
}
