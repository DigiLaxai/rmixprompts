import { GoogleGenAI, Modality } from "@google/genai";

interface Image {
    data: string;
    mimeType: string;
}

const getApiKey = (): string | null => {
    return sessionStorage.getItem('gemini-api-key');
}

const getGenAI = (): GoogleGenAI => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('API key is not configured. Please set it in the application.');
    }
    return new GoogleGenAI({ apiKey });
}

const imagePromptingSystemInstruction = `You are an expert at analyzing images and creating descriptive prompts for AI image generation. Describe the provided image in vivid detail. Cover the main subject, the background/setting, the artistic style (e.g., photorealistic, illustration, painting), the lighting, the color palette, composition, and overall mood. The description must be a single, coherent paragraph suitable for use as a prompt for a text-to-image AI model. Do not add any preamble or explanation.`;

export const generatePromptFromImage = async (image: Image): Promise<string> => {
    try {
        const ai = getGenAI();
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
        return genAIResponse.text.trim();
    } catch (error: any) {
        console.error("Error generating prompt:", error);
        const friendlyMessage = error.message?.includes('API key not valid') 
            ? 'Your API key is not valid. Please check it and try again.'
            : error.message || 'An unknown error occurred while generating the prompt.';
        throw new Error(friendlyMessage);
    }
}

export const generateImageFromPrompt = async (prompt: string): Promise<Image> => {
    try {
        const ai = getGenAI();
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
                return {
                    data: part.inlineData.data,
                    mimeType: part.inlineData.mimeType,
                };
            }
        }
        throw new Error('Image generation failed. No image data received.');
    } catch (error: any) {
        console.error("Error generating image:", error);
        const friendlyMessage = error.message?.includes('API key not valid') 
            ? 'Your API key is not valid. Please check it and try again.'
            : error.message || 'An unknown error occurred while generating the image.';
        throw new Error(friendlyMessage);
    }
};