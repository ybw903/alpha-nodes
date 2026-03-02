import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/backtest/**/*.ts", "lib/data/**/*.ts"],
      exclude: ["lib/data/mockData.ts", "**/*.d.ts"],
      thresholds: { lines: 80, functions: 85 },
    },
    include: ["tests/**/*.test.ts"],
  },
});
