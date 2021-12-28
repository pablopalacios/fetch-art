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
  attempts: 0,
};

api.get("/retry/reset", (req, res) => {
  retry.ok = false;
  retry.timeout = false;
  retry.attempts = 0;
  res.json(retry).end();
});

api.get("/retry/attempts", (req, res) => {
  res.json({ attempts: retry.attempts }).end();
});

api.get("/retry", (req, res) => {
  if (retry.ok) {
    res.status(200).json(answer);
  } else {
    retry.ok = true;
    res.status(502).json(retry);
  }
});

api.get("/always-retry", (req, res) => {
  retry.attempts += 1;
  res.status(502).json({ attempts: retry.attempts });
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
