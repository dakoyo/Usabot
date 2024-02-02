import express from "express";
const app = express();
const port = process.env.PORT || 3001;

app.get("/", async (req, res) => {
  try {
    res.send("<h1>Hello, world<h1>");
  } catch (e) {
    console.warn(e)
  }
})

// app.listen(port)

import("./bot.js");
