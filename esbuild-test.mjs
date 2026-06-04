import esbuild from "esbuild";
import fs from "fs";
const src = fs.readFileSync("src/pages/Home.tsx", "utf-8");
const r = await esbuild.transform(src, { loader: "tsx", sourcemap: false });

// Check if matchBuiltinRecipe appears in the esbuild output
const needle = "matchBuiltinRecipe";
const idx = r.code.indexOf(needle);
console.log(`"${needle}" in esbuild output:`, idx >= 0 ? `found at ${idx}` : "NOT FOUND");

// Check for builtinRecipes
console.log('"builtinRecipes" in esbuild output:', r.code.includes("builtinRecipes"));

// Check for ../data/recipes reference
console.log('"../data/recipes" in esbuild output:', r.code.includes("../data/recipes"));

// Check for the import statement
const importIdx = r.code.indexOf("import ");
if (importIdx >= 0) {
  console.log("\nFirst import:", r.code.substring(importIdx, importIdx + 100));
}

// Show all import statements
const imports = [...r.code.matchAll(/import\s+(?:{[^}]+}|[^;]+);/g)];
console.log("\nAll import statements:");
for (const m of imports) {
  console.log(" ", m[0].substring(0, 120));
}
