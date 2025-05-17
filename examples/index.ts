import express, { Router } from "express";
import { z } from "zod";
import { zodTypedRoutes } from "../src";

const app = express();
const router = Router();

app.use(express.json());

zodTypedRoutes(
  Router(),
  {
    params: z.object({
      userId: z.coerce.number(),
    }),
    body: z.object({
      name: z.string(),
      age: z.number().min(18),
    }),
  },
  (errors, _req, res) => {
    return res.status(400).json({ errors: errors.map(({ path, message }) => ({ path, message })) });
  }
).post("/users/:userId", (req, res) => {
  res.json({
    userId: req.params.userId,
    name: req.body.name,
    age: req.body.age,
  });
});

app.use(router);

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
