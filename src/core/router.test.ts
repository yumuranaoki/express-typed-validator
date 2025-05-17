import { applyValidationMiddleware } from "./router";
import express, { Router } from "express";
import request from "supertest";

describe("router", () => {
  it("should apply validation middleware", async () => {
    const successResult = { success: true as const, data: undefined };
    const paramsValidator = vitest.fn(() => successResult);
    const queryValidator = vitest.fn(() => successResult);
    const bodyValidator = vitest.fn(() => successResult);
    const validator = {
      params: { validate: paramsValidator },
      query: { validate: queryValidator },
      body: { validate: bodyValidator },
    };

    const router = Router();
    applyValidationMiddleware(router, validator).post("/messages/:messageId", (_req, res) => {
      res.send("ok");
    });

    const app = express();
    app.use(express.json());
    app.use(router);
    const resp = await request(app).post("/messages/123").query({ q: "thread" }).send({ message: "welcome" });

    expect(resp.status).toBe(200);
    expect(paramsValidator).toHaveBeenCalledWith({ messageId: "123" });
    expect(queryValidator).toHaveBeenCalledWith({ q: "thread" });
    expect(bodyValidator).toHaveBeenCalledWith({ message: "welcome" });
  });

  it("should call onError when validation failed", async () => {});
});
