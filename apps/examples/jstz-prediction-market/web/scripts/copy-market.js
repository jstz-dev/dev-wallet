import fs from "node:fs";
import path from "node:path";

const source = path.resolve("../market-dapp/dist");
const target = path.resolve("./artifacts");

// Remove old artifacts.
fs.rmSync(target, { recursive: true, force: true });

// Recreate the `artifacts` directory.
fs.mkdirSync(target, { recursive: true });

// Copy the artifact
fs.cpSync(source + "/market.js", target + "/market.js");

console.log("✔ market.js artifacts copied sucessfully.");
