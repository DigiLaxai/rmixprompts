interface Image {
    data: string;
    mimeType: string;
}

const callApi = async (endpoint: string, body: object) => {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || `Request failed with status ${response.status}`);
    }

    return result;
}

export const generatePromptFromImage = async (image: Image): Promise<string> => {
    const result = await callApi('/api/generatePrompt', { image });
    return result.prompt;
}

export const generateImageFromPrompt = async (prompt: string): Promise<Image> => {
    const result = await callApi('/api/generateImage', { prompt });
    return result.image;
};
