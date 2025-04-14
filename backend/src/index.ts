import express from "express";
import { answerStudentDoubt } from "./gemini";
import { createAudioFileFromText } from "./eleven-labs";
import { runWav2LipInference } from "./wav2lip";
import { generateManimAnimation } from "./manim";
import path from "path";
import fs from "fs";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

// Serve static files
app.use("/outputs", express.static(path.join(__dirname, "../outputs")));
app.use("/audio", express.static(path.join(__dirname, "../audio")));
app.use("/animations", express.static(path.join(__dirname, "../animations")));

// Create directories if they don't exist
const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

ensureDirectoryExists(path.join(__dirname, "../outputs"));
ensureDirectoryExists(path.join(__dirname, "../audio"));
ensureDirectoryExists(path.join(__dirname, "../input"));
ensureDirectoryExists(path.join(__dirname, "../animations"));

app.post("/answer", function (req, res) {
  (async () => {
    try {
      const { doubt, studentContext } = req.body;

      // Get answer from Gemini
      const answer = await answerStudentDoubt(doubt, studentContext);
      
      // Generate audio from the answer
      const audioFile = await createAudioFileFromText(answer.text);
      
      // Move the audio file to the proper directory
      const audioFilePath = path.join(__dirname, "../audio", audioFile);
      if (!fs.existsSync(audioFilePath)) {
        fs.renameSync(audioFile, audioFilePath);
      }
      
      // Generate video using Wav2Lip
      const sourceVideo = path.join(__dirname, "../input/input.mp4");
      const videoFile = await runWav2LipInference(
        sourceVideo,
        audioFilePath,
        path.join(__dirname, "../outputs")
      );
      
      // Generate Manim animation
      const animationPath = path.join(__dirname, "../animations");
      const animationFile = await generateManimAnimation(
        doubt,
        answer.text,
        animationPath
      );
      
      // Get the relative paths for the frontend to access
      const relativeAudioPath = `audio/${path.basename(audioFilePath)}`;
      const relativeVideoPath = `outputs/${path.basename(videoFile)}`;
      const relativeAnimationPath = `animations/${path.basename(animationFile)}`;

      res.json({
        answer,
        audioFile: relativeAudioPath,
        videoFile: relativeVideoPath,
        animationFile: relativeAnimationPath
      });
    } catch (error: any) {
      console.error("Error processing request:", error);
      res.status(500).json({
        error: "An error occurred while processing the request",
        details: error.message || String(error),
        success: false,
      });
    }
  })();
});

app.get("/health", function (_req, res) {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Keep this endpoint for direct video generation testing
app.post("/generate-video", async (req, res) => {
  try {
    const videoFile = await runWav2LipInference(
      path.join(__dirname, "../input/input.mp4"),
      path.join(__dirname, "../input/input3.mp3"),
      path.join(__dirname, "../outputs/")
    );
    res.json({ videoFile: `outputs/${path.basename(videoFile)}` });
  } catch (error: any) {
    console.error("Error generating video:", error);
    res.status(500).json({
      error: "An error occurred while generating the video",
      details: error.message || String(error),
      success: false,
    });
  }
});

// Add endpoint for direct animation generation testing
app.post("/generate-animation", function (req, res) {
  (async () => {
    try {
      const { doubt, answer } = req.body;
      
      if (!doubt) {
        return res.status(400).json({
          error: "Doubt is required",
          success: false
        });
      }
      
      // If answer isn't provided, generate one using Gemini
      let finalAnswer = answer;
      if (!finalAnswer) {
        try {
          const generatedAnswer = await answerStudentDoubt(doubt, {});
          finalAnswer = generatedAnswer.text;
        } catch (error) {
          console.error("Failed to generate answer with Gemini:", error);
          return res.status(500).json({
            error: "Failed to generate an answer for the doubt",
            success: false
          });
        }
      }
      
      console.log(`Generating animation for doubt: "${doubt.substring(0, 50)}..."`);
      
      const animationFile = await generateManimAnimation(
        doubt,
        finalAnswer,
        path.join(__dirname, "../animations/")
      );
      
      const relativeAnimationPath = `animations/${path.basename(animationFile)}`;
      
      res.json({ 
        animationFile: relativeAnimationPath,
        answer: finalAnswer,
        success: true
      });
    } catch (error: any) {
      console.error("Error generating animation:", error);
      res.status(500).json({
        error: "An error occurred while generating the animation",
        details: error.message || String(error),
        success: false,
      });
    }
  })();
});
