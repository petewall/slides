const path = require("path");
const fs = require("fs");
const fastify = require("fastify");
const fastifyStatic = require("@fastify/static");
const { loadContent, saveContent } = require("./loader");

function buildApp(opts) {
  const app = fastify({ logger: false });

  app.register(fastifyStatic, {
    root: path.join(__dirname, "..", "public"),
    prefix: "/",
  });

  app.get("/api/slides", async () => {
    return loadContent(opts.content);
  });

  app.put("/api/slides", async (request) => {
    saveContent(opts.content, request.body);
    return request.body;
  });

  app.get("/api/styles", async () => {
    return (opts.style || []).map((stylePath) =>
      fs.readFileSync(stylePath, "utf-8")
    );
  });

  return app;
}

module.exports = { buildApp };
