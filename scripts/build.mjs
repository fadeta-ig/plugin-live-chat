import { build, context } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isWatchMode = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
    absWorkingDir: projectRoot,
    entryPoints: ['assets/src/main.ts'],
    outfile: 'assets/dist/widget.js',
    bundle: true,
    format: 'iife',
    target: ['es2019'],
    minify: !isWatchMode,
    sourcemap: isWatchMode ? 'inline' : false,
    legalComments: 'none',
    logLevel: 'info',
};

const run = async () => {
    if (!isWatchMode) {
        await build(buildOptions);
        return;
    }
    const watcher = await context(buildOptions);
    await watcher.watch();
};

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
