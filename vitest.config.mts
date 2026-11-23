import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Lets tests import components the same way the app does ("@/lib/..."), and read JSX.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  oxc: { jsx: { runtime: "automatic" } },
});
