import esbuild from "esbuild";

// Test with a minimal TSX containing Chinese
const testCode = `
const categories = [
  ["meat", "肉類與海鮮", "🥩", ["鴨肉", "豬小排", "雞翅"]],
];
export function test() { return categories; }
`;
const r = await esbuild.transform(testCode, { loader: "tsx", sourcemap: false });
console.log("Input length:", testCode.length);
console.log("Output length:", r.code.length);
console.log("Output contains 鴨肉:", r.code.includes("鴨肉"));
console.log("Has 'meat':", r.code.includes("meat"));
console.log("\nFull output:\n", r.code);
