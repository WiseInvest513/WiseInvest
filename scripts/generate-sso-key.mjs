import { generateKeyPairSync } from "crypto";

const { privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },
});

console.log("WISE_SSO_KEY_ID=wise-sso-2026-08");
console.log(`WISE_SSO_PRIVATE_KEY=${privateKey.replace(/\n/g, "\\n")}`);
