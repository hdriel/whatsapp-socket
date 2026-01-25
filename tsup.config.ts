import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'], // Entry point(s) for your build
    format: ['esm', 'cjs'], // Output formats (ESM and CommonJS)
    dts: true, // Generate TypeScript declaration files
    outDir: 'dist',
    shims: true, // Add polyfills for better ESM/CJS interop
    splitting: false, //  Code splitting (disabled for libraries)
    sourcemap: true, // Generate source maps for debugging
    clean: true, // Clean output directory before build
    treeshake: true, // Remove unused code
    minify: true,
    target: 'node18',
    // external: ['music-metadata'], // Don't bundle these dependencies
});
