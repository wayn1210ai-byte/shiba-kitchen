// Try building with just esbuild directly
import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, existsSync } from 'fs';

// First verify the source file
console.log("=== Source file verification ===");
const src = readFileSync('src/pages/Home.tsx', 'utf-8');
console.log('Size:', src.length);
console.log('Has 鴨肉:', src.includes('鴨肉'));
console.log('Has 蚵仔:', src.includes('蚵仔'));
console.log('Lines with 鴨肉:', (src.match(/鴨肉/g) || []).length);

// Check the position of key elements
const idxHome = src.indexOf('export default function Home()');
const idxData = src.indexOf('內建食譜庫');
console.log('\nPosition of Home():', idxHome);
console.log('Position of 內建食譜庫:', idxData);
console.log('Data BEFORE Home?:', idxData < idxHome);

// Now transpile and check
console.log("\n=== Transpiling just the module ===");
const result = await esbuild.transform(src, {
  loader: 'tsx',
  jsx: 'automatic',
  format: 'esm',
});

console.log('Transpiled size:', result.code.length);
console.log('Has 鴨肉:', result.code.includes('鴨肉'));
console.log('Has 蚵仔:', result.code.includes('蚵仔'));
console.log('Has builtinRecipes:', result.code.includes('builtinRecipes'));
console.log('Has matchBuiltinRecipe:', result.code.includes('matchBuiltinRecipe'));

// Save transpiled version
writeFileSync('/tmp/home-esbuild.js', result.code);
console.log('\nSaved to /tmp/home-esbuild.js');
