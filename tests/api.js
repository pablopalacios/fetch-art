const express = require("express");

const api = express.Router();

api.get("/42", (req, res) => {
  res.json({ answer: 42 }).end();
});

module.exports = api;
