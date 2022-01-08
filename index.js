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

  return fetch(url, { signal: controller.signal }).then(
    function (response) {
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
    },
    function (err) {
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
    }
  );
}

function fart(url, options) {
  var controller = new AbortController();
  var attempts = 1;
  var maxAttempts = (options && options.maxAttempts) || 2;

  var promise = request(url, options, controller).catch(function retry(err) {
    if (err.name !== "FartAbortError" && attempts < maxAttempts) {
      attempts += 1;
      controller = new AbortController();
      return request(url, options, controller).catch(retry);
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
