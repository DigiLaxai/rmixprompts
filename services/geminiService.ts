interface Image {
    data: string;
    mimeType: string;
}

async function handleApiResponse(response: Response) {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred.' }));
        // Provide a more helpful message if the API key is likely missing on the server
        if (response.status === 500 && errorData.error?.includes('API key is not configured')) {
             throw new Error('The API key is not configured on the server. Please set the API_KEY environment variable in your Vercel project.');
        }
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    return response.json();
}

export const generatePromptFromImage = async (image: Image): Promise<string> => {
    const response = await fetch('/api/generatePrompt', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image }),
    });

    const data = await handleApiResponse(response);
    return data.prompt;
}

export const generateImageFromPrompt = async (prompt: string): Promise<Image> => {
    const response = await fetch('/api/generateImage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
    });
    
    const data = await handleApiResponse(response);
    return data.image;
};