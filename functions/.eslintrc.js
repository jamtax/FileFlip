/* eslint-env node */

module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  overrides: [
    {
      files: [".eslintrc.js"],
      env: {
        node: true
      },
      globals: {
        module: "readonly",
        require: "readonly",
      }
    }
  ],
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
    ecmaVersion: 2020,
  },
  settings: {
    react: {
      version: "detect"
    }
  },
  ignorePatterns: [
    "/lib/**/*",       // Ignore built files.
    "/generated/**/*", // Ignore generated files.
    ".eslintrc.js",    // Ignore this config file itself.
  ],
  plugins: [
    "@typescript-eslint",
    "import",
    "react"
  ],
  rules: {
    "quotes": ["error", "double"],
    "import/no-unresolved": 0,
    "indent": ["error", 2],
    "react/prop-types": "off", // If using TypeScript for props
  },
};
