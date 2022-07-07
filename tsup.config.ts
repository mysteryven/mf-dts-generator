import { defineConfig } from "tsup";

export default defineConfig({
    entry: {
        index: "src/server.ts"
    },
    format: ["cjs"],
    target: "es2022",
    sourcemap: true,
    splitting: false,
});