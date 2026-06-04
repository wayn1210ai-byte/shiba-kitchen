import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';

// Read the source
const src = readFileSync('src/pages/Home.tsx', 'utf-8');
console.log('Source size:', src.length);
console.log('Has 鴨肉:', src.includes('鴨肉'));
console.log('Has matchBuiltinRecipe:', src.includes('matchBuiltinRecipe'));

// Build with esbuild directly, writing to disk
await esbuild.build({
  entryPoints: ['src/pages/Home.tsx'],
  bundle: false,  // Don't bundle - just transpile
  format: 'esm',
  outfile: '/tmp/home-transpiled.js',
  loader: { '.tsx': 'tsx' },
  jsx: 'automatic',
});

// Verify output
const out = readFileSync('/tmp/home-transpiled.js', 'utf-8');
console.log('\nTranspiled size:', out.length);
console.log('Has 鴨肉:', out.includes('鴨肉'));
console.log('Has matchBuiltinRecipe:', out.includes('matchBuiltinRecipe'));
console.log('Has categories:', out.includes('肉類與海鮮'));
