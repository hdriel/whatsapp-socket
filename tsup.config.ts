import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        // Entry point(s) for your build
        index: 'src/index.ts',
        private: 'src/private.ts',
        group: 'src/group.ts',
    },
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
    // Handle external dependencies
    // external: ['@whiskeysockets/baileys', 'qrcode', 'mongodb', 'pino', '@hapi/boom'], // Don't bundle these dependencies
    // external: ['music-metadata'], // Don't bundle these dependencies
});
