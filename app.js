import express from "express";
const app = express();
import * as dotenv from "dotenv"
import config from "./config.js";
dotenv.config();

app.get("/", (req, res) => {
    res.send("Hello, world");
});

config.dev.debugMode || app.listen(config.express.port);
(async () => {
    await import("./models.js");
})();