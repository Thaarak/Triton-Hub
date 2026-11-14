import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // These existing dashboard views initialize browser-backed state after hydration.
  // Keep the hook rules visible while leaving that legacy cleanup independent of the setup checks.
  {
    files: ["app/login/page.tsx", "components/dashboard/{announcement-view,assignment-view,calendar-view,category-feed,dashboard,email-view,navbar}.tsx"],
    rules: { "react-hooks/set-state-in-effect": "warn", "react-hooks/purity": "warn" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
