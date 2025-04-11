import express, { Request, Response } from "express";
import { processDoubt } from "./model";

const app = express();  

app.get("/", async (req: Request, res: Response) => {
  const result = await processDoubt("what is the capital of india?");
  res.send(result);
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
