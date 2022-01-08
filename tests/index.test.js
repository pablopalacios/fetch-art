describe("fetch-art", () => {
  const host = "http://localhost:8000";
  const path = "/api";
  const baseUrl = `${host}${path}`;

  describe("JSON Support", () => {
    it("returns parsed response", () => {
      return fart(`${baseUrl}/42`).then((data) =>
        expect(data.answer).to.equal(42)
      );
    });

    it("throws ParseError if cant parse response", () => {
      return fart(host).catch((err) => {
        expect(err.name).to.equal("FartParseError");
      });
    });
  });

  describe("Abort support", () => {
    it("throws AbortError when abort is called", () => {
      const promise = fart(`${baseUrl}/delay/200`);

      promise.abort();

      promise.catch((err) => {
        expect(err.name).to.equal("FartAbortError");
      });
    });

    it("can be aborted after a timeout", (done) => {
      const promise = fart(`${baseUrl}/delay/201`, { timeout: 80 });
      setTimeout(() => {
        promise.abort();
        promise.catch((err) => {
          expect(err.name).to.equal("FartAbortError");
          done();
        });
      }, 100);
    });
  });

  describe("Timeout support", () => {
    it("throws TimeoutError when response takes too long", () => {
      return fart(`${baseUrl}/delay/200`, { timeout: 100 }).catch((err) => {
        expect(err.name).to.equal("FartTimeoutError");
      });
    });
  });

  describe("Retry support", () => {
    beforeEach((done) => {
      fart(`${baseUrl}/retry/reset`)
        .then(() => done())
        .catch(done);
    });

    it("automatic retry", () => {
      return fart(`${baseUrl}/retry`).then((data) => {
        expect(data.answer).to.equal(42);
      });
    });

    it("does not retry aborted requests", () => {
      const promise = fart(`${baseUrl}/retry`);
      promise.abort();

      return promise.catch((err) => {
        expect(err.name).to.equal("FartAbortError");
      });
    });

    it("retries timedout requests", () => {
      return fart(`${baseUrl}/timeout-retry`, { timeout: 200 }).then((data) => {
        expect(data.answer).to.equal(42);
      });
    });

    it("does not retry more than 5 times", () => {
      return fart(`${baseUrl}/always-retry`, { maxAttempts: 5 })
        .catch((err) => {
          expect(err.name).to.equal("FartHttpStatusError");
          return fart(`${baseUrl}/retry/attempts`);
        })
        .then((data) => {
          expect(data.attempts).to.equal(5);
        });
    });
  });
});
