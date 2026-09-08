import { GoogleGenAI } from '@google/genai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
export const isGeminiReady = Boolean(apiKey)

export async function askGemini(prompt: string) {
  if (!apiKey) {
    throw new Error('Add VITE_GEMINI_API_KEY to your .env file to connect Gemini.')
  }

  const ai = new GoogleGenAI({ apiKey })
  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
  })

  return response.text?.trim() || 'Gemini returned no answer.'
}
