const fs = require("fs");
const path = require("path");
const os = require("os");
const { buildApp } = require("../src/server");

describe("server", () => {
  let tmpDir;
  let app;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "marseille-server-"));
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeContent(name, content) {
    const filePath = path.join(tmpDir, name);
    fs.writeFileSync(filePath, content);
    return filePath;
  }

  function writeStyle(name, content) {
    const filePath = path.join(tmpDir, name);
    fs.writeFileSync(filePath, content);
    return filePath;
  }

  describe("GET /api/slides", () => {
    it("returns parsed slide data", async () => {
      const contentPath = writeContent(
        "content.yaml",
        `
meta:
  title: Server Test
slides:
  - content:
    - text: Hello
`
      );

      app = buildApp({ content: contentPath, style: [] });
      const res = await app.inject({ method: "GET", url: "/api/slides" });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.meta.title).toBe("Server Test");
      expect(body.slides).toHaveLength(1);
      expect(body.slides[0].content[0]).toEqual({
        type: "text",
        value: "Hello",
      });
    });
  });

  describe("PUT /api/slides", () => {
    it("updates slide data and persists to file", async () => {
      const contentPath = writeContent(
        "content.yaml",
        `
meta:
  title: Original
slides:
  - content:
    - text: Hello
`
      );

      app = buildApp({ content: contentPath, style: [] });

      const updated = {
        meta: { title: "Updated", subtitle: "", date: "", logo: "" },
        slides: [
          {
            frame: { title: "Updated", subtitle: "", date: "", logo: "" },
            content: [{ type: "text", value: "Changed" }],
          },
        ],
      };

      const putRes = await app.inject({
        method: "PUT",
        url: "/api/slides",
        payload: updated,
      });

      expect(putRes.statusCode).toBe(200);
      const putBody = JSON.parse(putRes.payload);
      expect(putBody.meta.title).toBe("Updated");
      expect(putBody.slides[0].content[0].value).toBe("Changed");

      // Verify GET returns updated data
      const getRes = await app.inject({ method: "GET", url: "/api/slides" });
      const getBody = JSON.parse(getRes.payload);
      expect(getBody.meta.title).toBe("Updated");

      // Verify file was written
      const fs = require("fs");
      const raw = fs.readFileSync(contentPath, "utf-8");
      expect(raw).toContain("Updated");
      expect(raw).toContain("Changed");
    });
  });

  describe("GET /api/styles", () => {
    it("returns empty array when no custom styles", async () => {
      const contentPath = writeContent(
        "content.yaml",
        `
slides:
  - content:
    - text: Hi
`
      );

      app = buildApp({ content: contentPath, style: [] });
      const res = await app.inject({ method: "GET", url: "/api/styles" });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toEqual([]);
    });

    it("returns custom CSS contents", async () => {
      const contentPath = writeContent(
        "content.yaml",
        `
slides:
  - content:
    - text: Hi
`
      );
      const stylePath = writeStyle("custom.css", "body { color: red; }");

      app = buildApp({ content: contentPath, style: [stylePath] });
      const res = await app.inject({ method: "GET", url: "/api/styles" });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toEqual(["body { color: red; }"]);
    });

    it("returns multiple custom CSS contents", async () => {
      const contentPath = writeContent(
        "content.yaml",
        `
slides:
  - content:
    - text: Hi
`
      );
      const style1 = writeStyle("a.css", ".a { color: blue; }");
      const style2 = writeStyle("b.css", ".b { color: green; }");

      app = buildApp({ content: contentPath, style: [style1, style2] });
      const res = await app.inject({ method: "GET", url: "/api/styles" });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toEqual([".a { color: blue; }", ".b { color: green; }"]);
    });
  });

  describe("GET /", () => {
    it("serves the index.html", async () => {
      const contentPath = writeContent(
        "content.yaml",
        `
slides:
  - content:
    - text: Hi
`
      );

      app = buildApp({ content: contentPath, style: [] });
      const res = await app.inject({ method: "GET", url: "/" });

      expect(res.statusCode).toBe(200);
      expect(res.headers["content-type"]).toMatch(/text\/html/);
    });
  });

  describe("GET /editor.html", () => {
    it("serves the editor page", async () => {
      const contentPath = writeContent(
        "content.yaml",
        `
slides:
  - content:
    - text: Hi
`
      );

      app = buildApp({ content: contentPath, style: [] });
      const res = await app.inject({ method: "GET", url: "/editor.html" });

      expect(res.statusCode).toBe(200);
      expect(res.headers["content-type"]).toMatch(/text\/html/);
      expect(res.payload).toContain("Editor");
    });
  });
});
