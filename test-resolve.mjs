import fs from "fs";
import esbuild from "esbuild";

// Read both files
const homeSrc = fs.readFileSync("src/pages/Home.tsx", "utf-8");
const recipesSrc = fs.readFileSync("src/data/recipes.ts", "utf-8");

// Check if the import path resolves to the right file
const importMatch = homeSrc.match(/import\s*{\s*matchBuiltinRecipe\s*}\s*from\s*"([^"]+)"/);
if (importMatch) {
  console.log("Import found:", importMatch[1]);
}

// Transform recipes.ts and see what happens
const r = await esbuild.transform(recipesSrc, { loader: "ts", sourcemap: false });
console.log("\nrecipes.ts transformed length:", r.code.length);
console.log("Has builtinRecipes:", r.code.includes("builtinRecipes"));

// Now check what Vite's resolve would do  
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Try to resolve the relative path
import { resolve } from "path";
const recipesPath = resolve("src/data/recipes.ts");
console.log("\nResolved path:", recipesPath);
console.log("File exists:", fs.existsSync(recipesPath));
