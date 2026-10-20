import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const main = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.WISE_SITES_ROOT || path.dirname(main);
const source = await readFile(path.join(main, "public/wise-popup.js"));
const destinations = ["ewxtf/public", "chain/public", "crypto/public", "VIP/site/public", "sim/public", "hold/public", "IPO/public", "witness"];
const check = process.argv.includes("--check");
let differs = false;
for (const directory of destinations) {
  const destination = path.join(root, directory, "wise-popup.js");
  if (check) {
    const same = source.equals(await readFile(destination));
    console.log(`${same ? "OK" : "DIFF"} ${directory}`);
    differs ||= !same;
  } else {
    await writeFile(destination, source);
    console.log(`Synced ${directory}`);
  }
}
if (differs) process.exitCode = 1;
