import {
  GoogleGenerativeAI,
  SchemaType,
  GenerationConfig,
} from "@google/generative-ai";

// const apiKey = process.env.GEMINI_API_KEY;
const apiKey = "AIzaSyDrjWAAjYbG8JQ6MEsD477dS2nSnH-HNkg";
if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not set");

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseModalities: [],
  responseMimeType: "application/json",
  responseSchema: {
    type: SchemaType.OBJECT,
    properties: {
      answer: { type: SchemaType.STRING },
    },
    required: ["answer"],
  },
};

async function processDoubt(doubt: string) {
  try {
    const chatSession = model.startChat({
      generationConfig: generationConfig as GenerationConfig,
      history: [],
    });

    const prompt = `{doubt: ${doubt}}`;
    const result = await chatSession.sendMessage(prompt);

    const responseText = result.response.text();
    return responseText;
  } catch (error) {
    console.error("Error processing YouTube video:", error);
    throw error;
  }
}

export { processDoubt };
