import { exec } from "child_process";
import path from "path";
import fs from "fs";

export async function runWav2LipInference(
  faceVideo: string,
  audioFile: string,
  outputPath: string,
  nosmooth: boolean = false
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(faceVideo)) {
      return reject(new Error(`Face video not found: ${faceVideo}`));
    }
    if (!fs.existsSync(audioFile)) {
      return reject(new Error(`Audio file not found: ${audioFile}`));
    }

    const wav2lipDir = path.resolve(__dirname, "../../Wav2Lip");
    const checkpointPath = path.join(wav2lipDir, "checkpoints/wav2lip_gan.pth");

    const outputFileName = `result_${Date.now()}.mp4`;
    const outputFilePath = path.join(outputPath, outputFileName);
    const command = `cd ${wav2lipDir} && python inference.py --checkpoint_path ${checkpointPath} --face ${faceVideo} --audio ${audioFile} --outfile ${outputFilePath}`;

    console.log(`Executing: ${command}`);

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Wav2Lip execution error: ${error}`);
        return reject(error);
      }

      if (stderr) {
        console.warn(`Wav2Lip stderr: ${stderr}`);
      }

      console.log(`Wav2Lip stdout: ${stdout}`);

      if (fs.existsSync(outputFilePath)) {
        return resolve(outputFilePath);
      } else {
        return reject(new Error("Output file was not generated"));
      }
    });
  });
}
