import { createRequestHandler } from "@react-router/express";
import express from "express";

const app = express();
app.use(express.static("build/client"));

app.use(
  createRequestHandler({
    build: await import("./build/server/index.js"),
  })
);

app.listen(7777, '0.0.0.0', () => {
  console.log("Server started on port 7777");
});