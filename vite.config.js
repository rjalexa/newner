import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// On GitHub Pages the app is served from https://rjalexa.github.io/newner/,
// so production builds need a "/newner/" base. Local dev stays at "/".
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/newner/" : "/",
  plugins: [react()],
  server: { port: 5173, open: false },
}));
