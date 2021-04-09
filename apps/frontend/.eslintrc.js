module.exports = {
  parser: "@typescript-eslint/parser", // Specifies the ESLint parser
  parserOptions: {
    // NOTE: These need to be set in each apps/* and packages/* projects.
    //tsconfigRootDir: __dirname,
    //project: ['./tsconfig.json'],
    ecmaFeatures: {
      jsx: true, // Allows for the parsing of JSX
    },
    ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
    sourceType: "module", // Allows for the use of imports
  },
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"],
    },
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
      }, // this loads <rootdir>/tsconfig.json to eslint
    },
    react: {
      version: "detect", // Tells eslint-plugin-react to automatically detect the version of React to use
    },
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    //"plugin:jest/recommended",
    "plugin:prettier/recommended", // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
  ],
  plugins: ["import", "sort-destructure-keys"],
  rules: {
    // too many changes
    "@typescript-eslint/ban-types": "warn",
    // too many changes - end
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", ignoreRestSiblings: true },
    ],
    "@typescript-eslint/no-use-before-define": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/no-empty-interface": [
      "error",
      {
        allowSingleExtends: true,
      },
    ],
    // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
    // e.g. "@typescript-eslint/explicit-function-return-type": "off",
    "sort-destructure-keys/sort-destructure-keys": "error", // Mainly to sort render props
    "import/no-unresolved": "error",
    "import/order": [
      "error",
      {
        "newlines-between": "always",
        pathGroups: [{ pattern: "@/**", group: "external", position: "after" }],
        alphabetize: { order: "asc" },
        groups: ["builtin", "external", "parent", "sibling", "index"],
      },
    ],
    "object-shorthand": "error",
    "prefer-destructuring": "warn",
    // a nice idea for some parts of the code, but definitely not all.
    "@typescript-eslint/explicit-module-boundary-types": "off",
  },
}
