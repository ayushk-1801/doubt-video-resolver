import {
  GoogleGenerativeAI,
  SchemaType,
  GenerationConfig,
} from "@google/generative-ai";
import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not set");

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

const template = `
  You are an empathetic and knowledgeable friend helping a student with their academic doubts.
  Your goal is to provide personalized, conversational explanations that address the specific question.
  Make your answers sound natural, as if a helpful human friend is explaining - not like an AI.
  
  Adapt your response style based on context clues about the student's level of understanding:
  
  For beginners: Use casual language, relatable examples, and patient step-by-step explanations.
  For intermediate learners: Balance friendly tone with more detailed explanations of relevant concepts.
  For advanced learners: Maintain conversational style while including deeper insights and nuanced details.
  
  You will always respond with a JSON object containing a single explanation text.
  
  IMPORTANT CONSTRAINTS:
  - Keep your response concise, ideally around 1000-2000 characters maximum.
  - Focus on the most important concepts and explanations.
  - Do NOT use Markdown tables in your explanations.
  - When comparing items, use bullet points or numbered lists instead of tables.
  - Present comparative information in paragraph form or with clear headings and bullet points.
  - Avoid using the pipe character (|) in your formatting.
  - Use simple formatting only - avoid complex markdown that might not render well in text-to-speech.
  - Limit the use of special characters and symbols that might not be properly vocalized.
  - Use contractions (like "don't", "can't", "I'll") as humans naturally do.
  - Occasionally include thinking phrases like "hmm", "let me think", or "you know what".
  - Include occasional filler words like "actually", "basically", "to be honest" where appropriate.
  - Sometimes start sentences with conjunctions like "And", "But", or "So".
  - Vary sentence length to create natural rhythm - mix short sentences with longer ones.
  
  Use a warm, friendly tone. Break complex topics into conversational chunks.
  Include relevant examples that feel personal and relatable when helpful, but stay concise.
`;

const generationConfig = {
  temperature: 0.3,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 2000,
  responseMimeType: "application/json",
  responseSchema: {
    type: SchemaType.OBJECT,
    properties: {
      text: { type: SchemaType.STRING },
    },
    required: ["text"],
  },
};

const parser = z.object({
  text: z.string().describe("Personalized explanation for the student"),
});

function validateResponse(response: any) {
  try {
    return parser.parse(response);
  } catch (error) {
    console.error("Validation error:", error);
    throw new Error("Response failed validation");
  }
}

function truncateExplanation(text: string, maxChars: number = 5000): string {
  if (text.length <= maxChars) return text;
  
  const endingPunctuation = ['.', '!', '?'];
  let cutoffPoint = maxChars;
  
  for (let i = maxChars; i > maxChars * 0.8; i--) {
    if (endingPunctuation.includes(text[i])) {
      cutoffPoint = i + 1;
      break;
    }
  }
  
  return text.substring(0, cutoffPoint);
}

async function answerStudentDoubt(
  doubt: string,
  studentContext: StudentContext = {}
) {
  try {
    const contextInfo = formatStudentContext(studentContext);

    const fullPrompt = `${template}\n\n${contextInfo}Student doubt: ${doubt}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig: generationConfig as GenerationConfig,
    });

    const responseText = result.response.text();
    const parsedResponse = JSON.parse(responseText);
    console.log(parsedResponse);
    
    if (parsedResponse.text) {
      parsedResponse.text = truncateExplanation(parsedResponse.text);
    }

    return validateResponse(parsedResponse);
  } catch (error) {
    console.error("Error processing student doubt:", error);
    throw error;
  }
}

interface StudentContext {
  gradeLevel?: string;
  subject?: string;
  previousTopics?: string[];
  learningStyle?: string;
  difficultyLevel?: "beginner" | "intermediate" | "advanced";
}

function formatStudentContext(context: StudentContext): string {
  if (Object.keys(context).length === 0) return "";

  let contextStr = "Student context:\n";
  if (context.gradeLevel)
    contextStr += `- Grade Level: ${context.gradeLevel}\n`;
  if (context.subject) contextStr += `- Subject: ${context.subject}\n`;
  if (context.previousTopics && context.previousTopics.length > 0) {
    contextStr += `- Previously covered topics: ${context.previousTopics.join(
      ", "
    )}\n`;
  }
  if (context.learningStyle)
    contextStr += `- Learning style: ${context.learningStyle}\n`;
  if (context.difficultyLevel)
    contextStr += `- Skill level: ${context.difficultyLevel}\n`;

  return contextStr + "\n";
}

export { answerStudentDoubt, parser, StudentContext };
