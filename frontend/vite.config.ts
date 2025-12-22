import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      host: "::",
      port: 80,
      proxy: {
      // Proxy requests starting with '/api' to your API server
      '/api': {
        target: 'http://localhost:8080', // or 'http://localhost:3000' in development
        // changeOrigin: true, // needed for virtual hosted sites
        // rewrite: (path) => path.replace(/^\/api/, ''), // remove the /api prefix when forwarding
      },
    },
    },
    build: {
      outDir: "dist/spa",
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
      },
    },
  };
});

