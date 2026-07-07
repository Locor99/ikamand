const { spawnSync } = require("child_process");
const ecosystem = require("../ecosystem.config");
const { logStartupInstructions } = require("../startup-info");

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    stdio: options.stdio || "inherit",
    shell: true
  });
}

run("pm2", ["delete", "ikamand"], { stdio: "ignore" });

const start = run("pm2", ["start", "ecosystem.config.js"]);

if (start.status !== 0) {
  process.exit(start.status);
}

const app = ecosystem.apps.find((app) => app.name === "ikamand");
const args = Array.isArray(app.args) ? app.args : app.args.split(/\s+/);
const ikamandArgIndex = args.findIndex((arg) => arg === "-i" || arg === "--ikamand");
const portArgIndex = args.findIndex((arg) => arg === "-p" || arg === "--port");
const ikamand = ikamandArgIndex >= 0 ? args[ikamandArgIndex + 1] : "<unknown>";
const port = portArgIndex >= 0 ? args[portArgIndex + 1] : 3000;

console.log("");
logStartupInstructions(port, ikamand);
console.log("");
console.log("Server started in the background. Use `npm stop` to stop it.");
