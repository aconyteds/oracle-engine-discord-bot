import { Request, Response } from "express";
import * as functions from "@google-cloud/functions-framework";
import { main } from "./main";

export const oracleEngine = (req: Request, res: Response) => {
  const app = main();
  app(req, res);
};

if (process.env.NODE_ENV !== "test") {
  functions.http("oracleEngine", oracleEngine);
}
