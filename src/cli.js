const { Command } = require("commander");

function parseArgs(argv) {
  const program = new Command();

  program
    .option("--content <file>", "Path to content file (YAML or JSON)", "content.yaml")
    .option("--style <file>", "Path to custom CSS file (can be specified multiple times)", collect, [])
    .option("--port <port>", "Port to listen on", "3000");

  program.parse(argv, { from: "user" });

  return program.opts();
}

function collect(value, previous) {
  return previous.concat([value]);
}

module.exports = { parseArgs };
