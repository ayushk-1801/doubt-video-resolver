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
  You are an empathetic and knowledgeable tutor who helps students with their academic doubts.
  Your goal is to provide personalized, clear explanations that address the student's specific question.
  You should adapt your response style based on context clues about the student's level of understanding.
  
  For beginners: Use simpler language, more examples, and step-by-step explanations.
  For intermediate learners: Provide more detailed explanations with relevant concepts.
  For advanced learners: Include deeper insights, connections to broader topics, and nuanced details.
  
  You will always respond with a JSON array of messages, with a maximum of 10 messages.
  Each message has the following properties:
  - text: Your helpful explanation text
  - facialExpression: The appropriate facial expression for the content
  - animation: A suitable animation that complements your response
  
  The different facial expressions are: smile, sad, angry, surprised, funnyFace, and default.
  The different animations are: Idle, TalkingOne, TalkingThree, SadIdle, Defeated, Angry, 
  Surprised, DismissingGesture and ThoughtfulHeadShake.
  
  Use a friendly and encouraging tone. Break complex topics into manageable parts.
  Include relevant examples to illustrate concepts when helpful.
`;

const generationConfig = {
  temperature: 0.3,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
  responseSchema: {
    type: SchemaType.OBJECT,
    properties: {
      messages: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            text: { type: SchemaType.STRING },
            facialExpression: { type: SchemaType.STRING },
            animation: { type: SchemaType.STRING },
          },
          required: ["text", "facialExpression", "animation"],
        },
      },
    },
    required: ["messages"],
  },
};

const parser = z.object({
  messages: z.array(
    z.object({
      text: z.string().describe("Personalized explanation for the student"),
      facialExpression: z
        .string()
        .describe(
          "Facial expression to be used by the AI. Select from: smile, sad, angry, surprised, funnyFace, and default"
        ),
      animation: z.string().describe(
        `Animation to be used by the AI. Select from: Idle, TalkingOne, TalkingThree, SadIdle, 
          Defeated, Angry, Surprised, DismissingGesture, and ThoughtfulHeadShake.`
      ),
    })
  ),
});

// Function to validate response against Zod schema
function validateResponse(response: any) {
  try {
    return parser.parse(response);
  } catch (error) {
    console.error("Validation error:", error);
    throw new Error("Response failed validation");
  }
}

// Chain-like structure to process student doubts through Gemini model
async function answerStudentDoubt(
  doubt: string,
  studentContext: StudentContext = {}
) {
  try {
    // Add any available context about the student to personalize the response
    const contextInfo = formatStudentContext(studentContext);

    // Create a properly formatted prompt combining the template and question
    const fullPrompt = `${template}\n\n${contextInfo}Student doubt: ${doubt}`;

    // Use a direct generation instead of chat session
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig: generationConfig as GenerationConfig,
    });

    const responseText = result.response.text();
    const parsedResponse = JSON.parse(responseText);
    console.log(parsedResponse);

    // Validate response against schema
    return validateResponse(parsedResponse);
  } catch (error) {
    console.error("Error processing student doubt:", error);
    throw error;
  }
}

// Interface for student context information
interface StudentContext {
  gradeLevel?: string;
  subject?: string;
  previousTopics?: string[];
  learningStyle?: string;
  difficultyLevel?: "beginner" | "intermediate" | "advanced";
}

// Format student context into a string for the prompt
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
