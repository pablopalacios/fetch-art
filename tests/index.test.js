function FartError(name, message, options) {
  this.name = "Fart" + name;
  this.message = message;
  this.options = options;
}

FartError.prototype = Object.create(Error.prototype);
FartError.prototype.constructor = FartError;

function request(url, options, controller) {
  var timeout = (options && options.timeout) || 3000;
  var timeoutAbort = false;
  var timeoutInterval = setTimeout(function () {
    timeoutAbort = true;
    controller.abort();
  }, timeout);

  return fetch(url, { signal: controller.signal })
    .catch(function (err) {
      clearTimeout(timeoutInterval);
      if (err.name === "AbortError") {
        if (timeoutAbort) {
          throw new FartError(
            "TimeoutError",
            "Request failed due to timeout",
            options
          );
        }
        throw new FartError(
          "AbortError",
          "Request was aborted by the user",
          options
        );
      }
      throw new FartError(err.name, err.message, options);
    })
    .then(function (response) {
      clearTimeout(timeoutInterval);
      if (!response.ok) {
        throw new FartError(
          "HttpStatusError",
          "Response has non 2** status",
          options
        );
      }
      return response.json().catch(function (err) {
        throw new FartError(
          "ParseError",
          "Response has non JSON format",
          options
        );
      });
    });
}

function fart(url, options) {
  var controller = new AbortController();
  var attempts = 0;
  var maxAttempts = (options && options.maxAttempts) || 2;

  var promise = request(url, options, controller).catch(function (err) {
    if (err.name !== "FartAbortError" && attempts < maxAttempts) {
      attempts += 1;
      controller = new AbortController();
      return request(url, options, controller);
    }

    throw err;
  });

  return {
    then: function (fn) {
      return promise.then(fn);
    },
    catch: function (fn) {
      return promise.catch(fn);
    },
    abort: function () {
      return controller.abort();
    },
  };
}

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
