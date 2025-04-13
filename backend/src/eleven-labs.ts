import * as dotenv from 'dotenv';
import { ElevenLabsClient } from 'elevenlabs';
import { createWriteStream } from 'fs';
import { v4 as uuid } from 'uuid';

dotenv.config();

// const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVEN_LABS_API_KEY = "sk_5ba3eb802287f4e4a7e25b1d65d79298f283f01edf247ac4";

const client = new ElevenLabsClient({
  apiKey: ELEVEN_LABS_API_KEY,
});

export const createAudioFileFromText = async (text: string): Promise<string> => {
  return new Promise<string>(async (resolve, reject) => {
    try {
      const audio = await client.textToSpeech.convert('JBFqnCBsd6RMkjVDRZzb', {
        model_id: 'eleven_multilingual_v2',
        text,
        output_format: 'mp3_44100_128',
        voice_settings: {
          stability: 0,
          similarity_boost: 0,
          use_speaker_boost: true,
          speed: 1.0,
        },
      });

      const fileName = `${uuid()}.mp3`;
      const fileStream = createWriteStream(fileName);

      audio.pipe(fileStream);
      fileStream.on('finish', () => resolve(fileName));
      fileStream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};
