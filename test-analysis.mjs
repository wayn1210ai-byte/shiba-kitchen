import fs from "fs";
const code = fs.readFileSync("dist/assets/index-D5MhjaTx.js", "utf-8");

// Search for any reference to the recipes data
// Look for patterns that suggest tree-shaking
const patterns = [
  "matchBuiltinRecipe",
  "builtinRecipes",
  "scoreRecipe", 
  "菜名",
  "dishName",
  "cookingSteps",
  "cookingTime",
  "螞蟻上樹",
  "三杯雞",
  "琥珀醬",
  "阿柴",
];

for (const p of patterns) {
  const count = (code.match(new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  console.log(`${p}: ${count} occurrences`);
}

// Check for eval or dynamic imports
console.log("\nHas eval():", code.includes("eval("));
console.log("\nHas import():", code.includes("import("));
