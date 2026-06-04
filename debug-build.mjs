import * as esbuild from 'esbuild';
import { readFileSync } from 'fs';

// First, verify the source file
const src = readFileSync('src/pages/Home.tsx', 'utf-8');
console.log('Source file length:', src.length);
console.log('Source has 鴨肉:', src.includes('鴨肉'));
console.log('Source has 蚵仔:', src.includes('蚵仔'));

const idx = src.indexOf('肉類與海鮮');
if (idx >= 0) {
  console.log('Source meat category snippet:');
  console.log(src.slice(idx, idx + 400));
}

// Now try to bundle
const r = await esbuild.build({
  entryPoints: ['src/pages/Home.tsx'],
  bundle: true,
  format: 'esm',
  write: false,
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
  },
  jsx: 'automatic',
  plugins: [{
    name: 'externalize-images',
    setup(build) {
      build.onResolve({ filter: /\.(png|jpg|svg|gif|css)$/ }, (args) => ({
        path: args.path,
        external: true,
      }));
      // Also handle @/ alias
      build.onResolve({ filter: /^@\// }, (args) => ({
        path: args.path.replace(/^@\//, './src/'),
        external: false,
      }));
    },
  }],
});

const text = r.outputFiles[0].text;
console.log('\n--- Bundled output ---');
console.log('Output size:', text.length);
console.log('鴨肉 in output:', text.includes('鴨肉'));
console.log('蚵仔 in output:', text.includes('蚵仔'));

const idx2 = text.indexOf('肉類與海鮮');
if (idx2 >= 0) {
  console.log('Found meat category in output');
  console.log(text.slice(idx2, idx2 + 400));
} else {
  console.log('NO meat category in output!');
  // Dump first 500 chars to see what's there
  console.log('First 500 chars:', text.slice(0, 500));
}
