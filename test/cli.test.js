const { parseArgs } = require("../src/cli");

describe("parseArgs", () => {
  it("parses --content flag", () => {
    const opts = parseArgs(["--content", "slides.yaml"]);
    expect(opts.content).toBe("slides.yaml");
  });

  it("defaults content to content.yaml", () => {
    const opts = parseArgs([]);
    expect(opts.content).toBe("content.yaml");
  });

  it("parses a single --style flag", () => {
    const opts = parseArgs(["--style", "custom.css"]);
    expect(opts.style).toEqual(["custom.css"]);
  });

  it("parses multiple --style flags", () => {
    const opts = parseArgs(["--style", "a.css", "--style", "b.css"]);
    expect(opts.style).toEqual(["a.css", "b.css"]);
  });

  it("defaults style to empty array", () => {
    const opts = parseArgs([]);
    expect(opts.style).toEqual([]);
  });

  it("parses --port flag", () => {
    const opts = parseArgs(["--port", "8080"]);
    expect(opts.port).toBe("8080");
  });

  it("defaults port to 4000", () => {
    const opts = parseArgs([]);
    expect(opts.port).toBe("4000");
  });
});
