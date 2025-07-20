import { resolve } from 'path';
import { defineConfig } from 'vite';

import {version} from "./package.json";

export default defineConfig({
  define: {
    __APP_VERSION__: version,
  },
  build: {
    outDir: 'dist',
    assetsDir: "src/assets",
    lib: {
      entry:  [resolve(__dirname, 'src/index.js')],
      fileName: (format, entryName) => `table_renderer_v${version}.${format}.js`,
      formats: ['es', 'umd'],
      name: "TableRenderer"
    },
    rollupOptions: {
      external: [], 
      output: {
        globals: {}, 
      },
      
    }
  }
});

