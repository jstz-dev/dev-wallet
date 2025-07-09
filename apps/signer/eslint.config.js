import js from "@eslint/js";

import prettier from "eslint-config-prettier/flat";
import jsdoc from "eslint-plugin-jsdoc";
import react from "eslint-plugin-react";
import reactCompiler from "eslint-plugin-react-compiler";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "examples"] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      prettier,
      reactHooks.configs["recommended-latest"],
      react.configs.flat.recommended,
      react.configs.flat["jsx-runtime"],
      reactCompiler.configs.recommended,
    ],
    settings: {
      react: {
        version: "detect",
      },
    },
    files: ["src/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: 2024,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
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
      "@typescript-eslint/prefer-namespace-keyword": "off",
      "@typescript-eslint/no-namespace": "off",

      "react-compiler/react-compiler": "warn",

      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-confusing-void-expression": ["error", { ignoreArrowShorthand: true }],
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: {
            arguments: false,
            attributes: false,
            inheritedMethods: true,
            properties: true,
            returns: true,
            variables: true,
          },
        },
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowNumber: true,
          allow: [{ name: ["Error", "URL", "URLSearchParams"], from: "lib" }],
        },
      ],
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
