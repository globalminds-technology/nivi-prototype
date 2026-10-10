import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/fakes/empty.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["core/**/*.test.ts", "infrastructure/**/*.test.ts", "tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["core/**/*.ts"],
      exclude: ["**/*.test.ts", "core/application/ports/**"],
    },
  },
});
