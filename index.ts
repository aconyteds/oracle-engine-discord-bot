import { Request, Response } from "express";
import * as functions from "@google-cloud/functions-framework";
import "./main";

functions.http("oracleEngine", (req: Request, res: Response) => {
  res.send("Bot is running.");
});
