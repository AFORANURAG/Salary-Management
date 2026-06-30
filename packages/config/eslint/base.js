/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  {
    ignores: ["**/dist/**", "**/.next/**", "**/node_modules/**"],
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "no-console": "off",
    },
  },
];
