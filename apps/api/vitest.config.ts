import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [swc.vite()],
  test: {
    globals: true,
    root: ".",
    include: ["src/**/*.spec.ts", "test/**/*.e2e-spec.ts"],
    env: {
      NODE_ENV: "test",
      DB_NAME: process.env.TEST_DB_NAME ?? "salary_mgmt_test",
    },
    globalSetup: ["./test/setup/global-setup.ts"],
    setupFiles: ["./test/setup/setup-each.ts"],
    // TypeORM connections are not safe to share across parallel workers.
    pool: "threads",
    poolOptions: { threads: { singleThread: true } },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
