import js from "@eslint/js";

import prettier from "eslint-config-prettier/flat";
import jsdoc from "eslint-plugin-jsdoc";
import react from "eslint-plugin-react";
import reactCompiler from "eslint-plugin-react-compiler";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      prettier,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs["vite"],
      react.configs.flat.recommended,
      react.configs.flat["jsx-runtime"],
      reactCompiler.configs.recommended,
    ],
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: 2024,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: globals.browser,
    },
    rules: {
      "func-style": ["warn", "declaration"],

      "react/function-component-definition": [
        "warn",
        {
          namedComponents: "function-declaration",
          unnamedComponents: "arrow-function",
        },
      ],
      "react/jsx-boolean-value": ["warn", "never"],
      "react/jsx-curly-brace-presence": ["warn", "never"],
      "react/no-unstable-nested-components": ["error", { allowAsProps: true }],
      "react/self-closing-comp": "error",
      "react/prop-types": "off",

      "react-compiler/react-compiler": "warn",

      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    extends: [jsdoc.configs["flat/recommended"]],
    files: ["**/*.{js,jsx}"],
    rules: {
      "jsdoc/require-jsdoc": "off",
      "jsdoc/require-param": "off",
      "jsdoc/require-returns": "off",
    },
  },
);
