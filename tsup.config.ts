import { defineConfig } from "tsup"
export default defineConfig({
  entry: ["src/index.ts", "src/providers/kadima-card.ts", "src/providers/kadima-ach.ts"],
  outDir: ".medusa/server/src",
  format: ["esm"],
  dts: true,
  clean: true,
  bundle: true,
  target: "node20",
  external: [/^@medusajs\//],
})
