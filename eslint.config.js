const js = require("@eslint/js");

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        process: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        URL: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      eqeqeq: "error",
      curly: "error",
      "no-var": "error",
      "prefer-const": "error",
    },
  },
  {
    files: ["public/**/*.js"],
    languageOptions: {
      sourceType: "script",
      globals: {
        document: "readonly",
        window: "readonly",
        fetch: "readonly",
        HTMLElement: "readonly",
        URLSearchParams: "readonly",
      },
    },
  },
  {
    files: ["test/**/*.js"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        vi: "readonly",
      },
    },
  },
];
