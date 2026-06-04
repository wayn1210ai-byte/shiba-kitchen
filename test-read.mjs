import fs from "fs";
const src = fs.readFileSync("src/pages/Home.tsx", "utf-8");
console.log("Source file size:", src.length);
console.log("Has 鴨肉:", src.includes("鴨肉"));
console.log("Has 肉類與海鮮:", src.includes("肉類與海鮮"));

// Find categories
const idx = src.indexOf("肉類與海鮮");
if (idx >= 0) {
  console.log("Categories found at:", idx);
  console.log("Context:", src.substring(Math.max(0, idx-50), idx + 200));
}
