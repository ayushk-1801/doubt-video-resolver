import express, { Request, Response } from "express";
import { answerStudentDoubt } from "./gemini";

const app = express();

app.use(express.json());

app.get("/", async (req: Request, res: Response) => {
  const body = req.body;
  const result = await answerStudentDoubt(body.doubt, body.studentContext);
  res.send(result);
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
