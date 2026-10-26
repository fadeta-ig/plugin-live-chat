import { build, context } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isWatchMode = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const jsOptions = {
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

/** @type {import('esbuild').BuildOptions} */
const cssOptions = {
    absWorkingDir: projectRoot,
    entryPoints: ['assets/css/widget.css'],
    outfile: 'assets/dist/widget.css',
    bundle: true,
    minify: !isWatchMode,
    sourcemap: isWatchMode ? 'inline' : false,
    legalComments: 'none',
    logLevel: 'info',
};

const run = async () => {
    if (!isWatchMode) {
        await Promise.all([build(jsOptions), build(cssOptions)]);
        return;
    }
    const [jsWatcher, cssWatcher] = await Promise.all([
        context(jsOptions),
        context(cssOptions),
    ]);
    await Promise.all([jsWatcher.watch(), cssWatcher.watch()]);
};

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
