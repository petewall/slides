const fs = require("fs");
const path = require("path");
const os = require("os");
const { loadContent } = require("../src/loader");

describe("loadContent", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "marseille-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeFile(name, content) {
    const filePath = path.join(tmpDir, name);
    fs.writeFileSync(filePath, content);
    return filePath;
  }

  describe("file loading", () => {
    it("loads a YAML file", () => {
      const filePath = writeFile(
        "content.yaml",
        `
meta:
  title: Test
slides:
  - content:
    - type: text
      value: Hello
`
      );
      const result = loadContent(filePath);
      expect(result.meta.title).toBe("Test");
    });

    it("loads a JSON file", () => {
      const filePath = writeFile(
        "content.json",
        JSON.stringify({
          meta: { title: "JSON Test" },
          slides: [{ content: [{ type: "text", value: "Hi" }] }],
        })
      );
      const result = loadContent(filePath);
      expect(result.meta.title).toBe("JSON Test");
    });

    it("throws for unsupported file extension", () => {
      const filePath = writeFile("content.txt", "hello");
      expect(() => loadContent(filePath)).toThrow("Unsupported file format");
    });

    it("throws for missing file", () => {
      expect(() => loadContent("/nonexistent/file.yaml")).toThrow();
    });
  });

  describe("meta defaults", () => {
    it("provides empty defaults for missing meta fields", () => {
      const filePath = writeFile(
        "content.yaml",
        `
slides:
  - content:
    - type: text
      value: Hello
`
      );
      const result = loadContent(filePath);
      expect(result.meta.title).toBe("");
      expect(result.meta.subtitle).toBe("");
      expect(result.meta.date).toBe("");
      expect(result.meta.logo).toBe("");
    });

    it("preserves provided meta fields", () => {
      const filePath = writeFile(
        "content.yaml",
        `
meta:
  title: My Talk
  subtitle: A subtitle
  date: "2026-04-09"
  logo: https://example.com/logo.png
slides:
  - content:
    - type: text
      value: Hello
`
      );
      const result = loadContent(filePath);
      expect(result.meta.title).toBe("My Talk");
      expect(result.meta.subtitle).toBe("A subtitle");
      expect(result.meta.date).toBe("2026-04-09");
      expect(result.meta.logo).toBe("https://example.com/logo.png");
    });
  });

  describe("slide frame inheritance", () => {
    it("inherits meta fields into slide frames", () => {
      const filePath = writeFile(
        "content.yaml",
        `
meta:
  title: Global Title
  subtitle: Global Subtitle
slides:
  - content:
    - type: text
      value: Hello
`
      );
      const result = loadContent(filePath);
      expect(result.slides[0].frame.title).toBe("Global Title");
      expect(result.slides[0].frame.subtitle).toBe("Global Subtitle");
    });

    it("allows slide to override frame fields", () => {
      const filePath = writeFile(
        "content.yaml",
        `
meta:
  title: Global Title
slides:
  - title: Slide Title
    content:
    - type: text
      value: Hello
`
      );
      const result = loadContent(filePath);
      expect(result.slides[0].frame.title).toBe("Slide Title");
    });

    it("allows slide to blank a frame field with empty string", () => {
      const filePath = writeFile(
        "content.yaml",
        `
meta:
  title: Global Title
  subtitle: Global Subtitle
slides:
  - title: ""
    subtitle: ""
    content:
    - type: text
      value: Hello
`
      );
      const result = loadContent(filePath);
      expect(result.slides[0].frame.title).toBe("");
      expect(result.slides[0].frame.subtitle).toBe("");
    });
  });

  describe("content normalization", () => {
    it("normalizes text shorthand", () => {
      const filePath = writeFile(
        "content.yaml",
        `
slides:
  - content:
    - text: Hello World
`
      );
      const result = loadContent(filePath);
      expect(result.slides[0].content[0]).toEqual({
        type: "text",
        value: "Hello World",
      });
    });

    it("normalizes text with options", () => {
      const filePath = writeFile(
        "content.yaml",
        `
slides:
  - content:
    - text: Big Text
      size: larger
`
      );
      const result = loadContent(filePath);
      expect(result.slides[0].content[0]).toEqual({
        type: "text",
        value: "Big Text",
        size: "larger",
      });
    });

    it("normalizes image shorthand", () => {
      const filePath = writeFile(
        "content.yaml",
        `
slides:
  - content:
    - image: https://example.com/pic.png
`
      );
      const result = loadContent(filePath);
      expect(result.slides[0].content[0]).toEqual({
        type: "image",
        url: "https://example.com/pic.png",
      });
    });

    it("normalizes iframe shorthand", () => {
      const filePath = writeFile(
        "content.yaml",
        `
slides:
  - content:
    - iframe:
        url: https://example.com
`
      );
      const result = loadContent(filePath);
      expect(result.slides[0].content[0]).toEqual({
        type: "iframe",
        url: "https://example.com",
      });
    });

    it("normalizes html shorthand", () => {
      const filePath = writeFile(
        "content.yaml",
        `
slides:
  - content:
    - html: "<div>Custom</div>"
`
      );
      const result = loadContent(filePath);
      expect(result.slides[0].content[0]).toEqual({
        type: "html",
        value: "<div>Custom</div>",
      });
    });

    it("normalizes columns with nested content", () => {
      const filePath = writeFile(
        "content.yaml",
        `
slides:
  - content:
    - columns:
      - text: Left
      - text: Right
`
      );
      const result = loadContent(filePath);
      const col = result.slides[0].content[0];
      expect(col.type).toBe("columns");
      expect(col.items).toHaveLength(2);
      expect(col.items[0]).toEqual({ type: "text", value: "Left" });
      expect(col.items[1]).toEqual({ type: "text", value: "Right" });
    });
  });

  describe("validation", () => {
    it("throws if slides array is missing", () => {
      const filePath = writeFile(
        "content.yaml",
        `
meta:
  title: No slides
`
      );
      expect(() => loadContent(filePath)).toThrow("must contain a slides array");
    });

    it("throws if slides is not an array", () => {
      const filePath = writeFile(
        "content.yaml",
        `
slides: "not an array"
`
      );
      expect(() => loadContent(filePath)).toThrow("must contain a slides array");
    });

    it("returns an empty content array for a slide with no content", () => {
      const filePath = writeFile(
        "content.yaml",
        `
slides:
  - title: Empty slide
`
      );
      const result = loadContent(filePath);
      expect(result.slides[0].content).toEqual([]);
    });
  });
});
