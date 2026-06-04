import * as esbuild from 'esbuild';

const r = await esbuild.build({
  entryPoints: ['src/pages/Home.tsx'],
  bundle: true,
  format: 'esm',
  write: false,
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
    '.png': 'file',
    '.jpg': 'file',
    '.svg': 'file',
  },
  jsx: 'automatic',
  outdir: '/tmp/esbuild-test',
  alias: { '@': './src' },
  plugins: [{
    name: 'external-images',
    setup(build) {
      build.onResolve({ filter: /\.(png|jpg|svg|gif)$/ }, (args) => ({
        path: args.path,
        external: true,
      }));
    },
  }],
});

const text = r.outputFiles[0].text;
console.log('Output size:', text.length);
console.log('鴨肉 in output:', text.includes('鴨肉'));
console.log('蚵仔 in output:', text.includes('蚵仔'));

const idx = text.indexOf('肉類與海鮮');
if (idx >= 0) {
  console.log('Found meat category');
  console.log(text.slice(idx, idx + 400));
} else {
  console.log('NO meat category found!');
}
