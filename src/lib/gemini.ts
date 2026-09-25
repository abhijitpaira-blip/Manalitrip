import { GoogleGenAI } from '@google/genai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
export const isGeminiReady = Boolean(apiKey)

const MODEL_FALLBACKS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3-flash-preview']

export async function askGemini(prompt: string) {
  if (!apiKey) {
    throw new Error('Add VITE_GEMINI_API_KEY to your .env file to connect Gemini.')
  }

  const ai = new GoogleGenAI({ apiKey })
  let lastError: unknown = null

  for (const model of MODEL_FALLBACKS) {
    try {
      const response = await ai.models.generateContent({ model, contents: prompt })
      return response.text?.trim() || 'Gemini returned no answer.'
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Gemini request failed.')
}
