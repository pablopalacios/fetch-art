const express = require("express");

const api = express.Router();

const answer = { answer: 42 };

api.get("/42", (req, res) => {
  res.json(answer);
});

api.get("/delay/:delay", (req, res) => {
  setTimeout(() => {
    res.json(answer);
  }, parseInt(req.params.delay, 10));
});

const retry = {
  ok: false,
  timeout: false,
};

api.get("/retry/reset", (req, res) => {
  retry.ok = false;
  retry.timeout = false;
  res.json(retry).end();
});

api.get("/retry", (req, res) => {
  if (retry.ok) {
    res.status(200).json(answer);
  } else {
    retry.ok = true;
    res.status(502).json(retry);
  }
});

api.get("/timeout-retry", (req, res) => {
  if (retry.timeout) {
    res.status(200).json(answer);
  } else {
    retry.timeout = true;
    setTimeout(() => {
      res.status(502).json(retry);
    }, 3000);
  }
});

module.exports = api;
