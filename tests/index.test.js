describe("fetch-art", () => {
  it("works", () => {
    return fetch("http://localhost:8000/api/42")
      .then((response) => response.json())
      .then((data) => {
        expect(data.answer).to.equal(42);
      });
  });
});
