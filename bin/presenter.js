#!/usr/bin/env node

const { parseArgs } = require("../src/cli");
const { buildApp } = require("../src/server");

const opts = parseArgs(process.argv.slice(2));
const app = buildApp(opts);

app.listen({ port: parseInt(opts.port, 10), host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Presenter running at ${address}`);
});
