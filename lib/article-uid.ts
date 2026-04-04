export function genUid(id: string): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let h1 = 5381, h2 = 52711;
  for (let i = 0; i < id.length; i++) {
    const c = id.charCodeAt(i);
    h1 = ((h1 << 5) + h1) ^ c;
    h2 = ((h2 << 5) + h2) ^ c;
  }
  let result = "";
  let seed = ((h1 >>> 0) * 0x100000000 + (h2 >>> 0));
  for (let i = 0; i < 8; i++) {
    result += chars[Math.abs(Math.floor(seed / Math.pow(62, i))) % 62];
  }
  return result;
}
