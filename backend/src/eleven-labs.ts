import { ElevenLabsClient } from "elevenlabs";
import dotenv from "dotenv";
dotenv.config();

const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
const voiceID = "D38z5RcWu1voky8WS1ja"; // Fin
const modelID = "eleven_multilingual_v2";

const client = new ElevenLabsClient({
  apiKey: elevenLabsApiKey,
});

async function convertTextToSpeech({
  text,
  fileName,
}: {
  text: string;
  fileName: string;
}) {
  const audio = await client.generate({
    voice: voiceID,
    text: text,
    model_id: modelID,
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.5,
      style: 0.5,
      speed: 0.5,
    },
  });

  // Save the audio to file
  const fs = require("fs");
  audio.pipe(fs.createWriteStream(fileName));
}

export { convertTextToSpeech, client };
