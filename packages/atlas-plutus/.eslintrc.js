const base = require("../../.eslintrc.base")

module.exports = {
    ...base,
    rules: {
        ...base.rules,
        "@typescript-eslint/ban-ts-comment": "warn"
    }
}
