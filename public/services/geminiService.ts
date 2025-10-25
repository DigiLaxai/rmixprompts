
import { GoogleGenAI, Modality } from "@google/genai";

interface Image {
    data: string;
    mimeType: string;
}

const imagePromptingSystemInstruction = `You are an expert at analyzing images and creating descriptive prompts for AI image generation. Describe the provided image in vivid detail. Cover the main subject, the background/setting, the artistic style (e.g., photorealistic, illustration, painting), the lighting, the color palette, composition, and overall mood. The description must be a single, coherent paragraph suitable for use as a prompt for a text-to-image AI model. Do not add any preamble or explanation.`;

const getGenAIClient = (apiKey: string) => {
    if (!apiKey) {
        throw new Error('API key is not configured. Please add your API key to continue.');
    }
    return new GoogleGenAI({ apiKey });
};

export const generatePromptFromImage = async (image: Image, apiKey: string): Promise<string> => {
    try {
        const ai = getGenAIClient(apiKey);
        
        const contents = {
            parts: [{
                inlineData: {
                    data: image.data,
                    mimeType: image.mimeType,
                },
            },
            { text: "Describe this image for a text-to-image AI model." }
        ]};

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents,
            config: {
                systemInstruction: imagePromptingSystemInstruction,
                temperature: 0.4,
            },
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error generating prompt from image:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during prompt generation.';
        throw new Error(errorMessage);
    }
}

export const generateImageFromPrompt = async (prompt: string, apiKey: string): Promise<Image> => {
    try {
        const ai = getGenAIClient(apiKey);
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return {
                    data: part.inlineData.data,
                    mimeType: part.inlineData.mimeType,
                };
            }
        }
        
        throw new Error('Image generation failed. No image data received.');
    } catch (error) {
        console.error("Error generating image from prompt:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during image generation.';
        throw new Error(errorMessage);
    }
};