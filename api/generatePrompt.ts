import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

const imagePromptingSystemInstruction = `You are an expert at analyzing images and creating descriptive prompts for AI image generation. Describe the provided image in vivid detail. Cover the main subject, the background/setting, the artistic style (e.g., photorealistic, illustration, painting), the lighting, the color palette, composition, and overall mood. The description must be a single, coherent paragraph suitable for use as a prompt for a text-to-image AI model. Do not add any preamble or explanation.`;

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests allowed' });
  }

  try {
    const { image } = request.body;
    if (!image || !image.data || !image.mimeType) {
        return response.status(400).json({ error: 'Invalid image data provided.' });
    }
    
    if (!process.env.API_KEY) {
        return response.status(500).json({ error: 'API key is not configured.' });
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const contents = {
        parts: [{
            inlineData: {
                data: image.data,
                mimeType: image.mimeType,
            },
        },
        { text: "Describe this image for a text-to-image AI model." }
    ]};

    const genAIResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
            systemInstruction: imagePromptingSystemInstruction,
            temperature: 0.4,
        },
    });

    return response.status(200).json({ prompt: genAIResponse.text.trim() });

  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return response.status(500).json({ error: errorMessage });
  }
}
