import express from "express";
const app = express();

app.get("/", (req, res) => {
    res.send("hello");
})

import("./bot.js");

console.log(new Date())

app.listen(3000)
