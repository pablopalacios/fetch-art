const path = require("path");
const express = require("express");
const api = require("./api");

const app = express();

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/fart.js", (req, res) => {
  res.sendFile(path.join(__dirname, "../index.js"));
});

app.use("/api", api);

app.use("/static", express.static(path.join(__dirname, "../node_modules")));

app.get("/tests/index.test.js", (req, res) => {
  res.sendFile(path.join(__dirname, "index.test.js"));
});

app.listen(8000, () => {
  console.log("Listening at: http://localhost:8000");
});
