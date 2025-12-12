import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Sends the pre-composited image (original + whitespace) to Gemini
 * to fill in the missing details.
 */
export const expandImage = async (
  base64Image: string,
  prompt: string
): Promise<string> => {
  try {
    // Remove data URL prefix if present for the API call
    const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    
    // Default prompt enhancement to guide the model specifically for outpainting
    const systemInstruction = `You are an expert image editor and artist specializing in 'outpainting' or image extension. 
    The user will provide an image that has been placed on a larger canvas with white/blank space around it. 
    Your task is to fill in this white space seamlessly, matching the style, lighting, texture, and context of the original central image. 
    Do not alter the original central content if possible, but blend the edges naturally. 
    The output should be a single, cohesive image.`;

    const userPrompt = prompt 
      ? `${prompt}. Fill the surrounding empty white space to expand the scene naturally.` 
      : "Fill the surrounding empty white space to expand the scene naturally, matching the existing style and context seamlessly.";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: userPrompt
          },
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Data
            }
          }
        ]
      },
      config: {
        systemInstruction: systemInstruction,
        // Temperature 0.4 often helps with consistency in extension tasks vs high creativity
        temperature: 0.4, 
      }
    });

    // Check for image in response
    // The model might return text if it refuses, or an image.
    // We iterate to find the image part.
    if (response.candidates && response.candidates.length > 0) {
      const parts = response.candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image data returned from Gemini. The model may have refused the request or generated only text.");

  } catch (error) {
    console.error("Error expanding image:", error);
    throw error;
  }
};
