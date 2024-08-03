import request from "supertest";
import { createServer, Server } from "http";
import { main } from "../main";
import * as dotenv from "dotenv";

dotenv.config();

describe("Health Check", () => {
  let server: Server;
  beforeAll((done) => {
    const app = main();
    server = createServer((req, res) => app(req as any, res as any));
    server.listen(3000, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  it("should return 200 on health check endpoint", async () => {
    const response = await request(server).get("/healthCheck");
    expect(response.status).toBe(200);
    expect(response.body).toBe(true);
  });
});
