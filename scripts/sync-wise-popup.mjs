import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const main = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.WISE_SITES_ROOT || path.dirname(main);
const assets = ["wise-popup.js", "kraken-logo.jpg"];
const destinations = ["ewxtf/public", "chain/public", "crypto/public", "VIP/site/public", "sim/public", "hold/public", "IPO/public", "witness"];
const check = process.argv.includes("--check");
let differs = false;
for (const asset of assets) {
  const source = await readFile(path.join(main, "public", asset));
  for (const directory of destinations) {
    const destination = path.join(root, directory, asset);
    if (check) {
      const same = source.equals(await readFile(destination));
      console.log(`${same ? "OK" : "DIFF"} ${directory}/${asset}`);
      differs ||= !same;
    } else {
      await writeFile(destination, source);
      console.log(`Synced ${directory}/${asset}`);
    }
  }
}
if (differs) process.exitCode = 1;
