import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['./src/extension.ts'],
  external: ["vscode"],
  bundle: true,
  format: "cjs",
  platform: "node",
  sourcemap: true,
  minify: true,
  outfile: './out/extension.js',
});