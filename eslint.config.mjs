import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Clean Architecture dependency rule — imports only point inward:
 *   app/components  ->  core/application  ->  core/domain
 *   infrastructure  ->  core/application (implements ports)
 * The composition root (infrastructure/di) is the only infra entry the UI may use.
 */
const layer = (group, message) => ({ group, message });

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["core/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            layer(
              ["@/core/application/*", "@/core/application/**", "@/infrastructure/**", "@/app/**", "@/components/**", "@/hooks/**", "@/lib/**"],
              "Domain must not depend on outer layers.",
            ),
            layer(["next", "next/*", "react", "react/*", "react-dom", "server-only"], "Domain must be framework-free."),
          ],
        },
      ],
    },
  },
  {
    files: ["core/application/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            layer(
              ["@/infrastructure/**", "@/app/**", "@/components/**", "@/hooks/**"],
              "Application depends on ports, never on adapters or UI.",
            ),
            layer(["next", "next/*", "react", "react/*", "react-dom"], "Application must be framework-free."),
          ],
        },
      ],
    },
  },
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "hooks/**/*.{ts,tsx}", "proxy.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/infrastructure/**", "!@/infrastructure/di", "!@/infrastructure/di/**"],
              message: "UI must go through use-cases via @/infrastructure/di (composition root).",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
  ]),
]);

export default eslintConfig;
