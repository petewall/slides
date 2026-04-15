const path = require("path");
const fs = require("fs");
const fastify = require("fastify");
const fastifyStatic = require("@fastify/static");
const { loadContent, saveContent } = require("./loader");

function buildApp(opts) {
  const app = fastify({ logger: false });

  let slideData = loadContent(opts.content);
  const customStyles = (opts.style || []).map((stylePath) =>
    fs.readFileSync(stylePath, "utf-8")
  );

  app.register(fastifyStatic, {
    root: path.join(__dirname, "..", "public"),
    prefix: "/",
  });

  app.get("/api/slides", async () => {
    return slideData;
  });

  app.put("/api/slides", async (request) => {
    slideData = request.body;
    saveContent(opts.content, slideData);
    return slideData;
  });

  app.get("/api/styles", async () => {
    return customStyles;
  });

  return app;
}

module.exports = { buildApp };
