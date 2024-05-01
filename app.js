import express from "express";
const app = express();
import * as dotenv from "dotenv"
import config from "./config.js";
import client from "./client.js";
dotenv.config();

app.get("/", (req, res) => {
    res.send("Hello, world");
});


if (!config.dev.debugMode) app.listen(3000)
import "./models.js";
