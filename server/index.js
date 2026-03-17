import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { initDb } from "./db/db.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

async function start() {
  await initDb();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
