import { Request, Response } from "express";
import * as functions from "@google-cloud/functions-framework";
import "./main";

export const oracleEngine = async (req: Request, res: Response) => {
  res.send("Bot is running.");
};

functions.http("oracleEngine", oracleEngine);
