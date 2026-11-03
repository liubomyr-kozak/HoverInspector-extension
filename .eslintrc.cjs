module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended"
    ],
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        },
        "ecmaVersion": 12,
        "sourceType": "module"
    },
    "plugins": [
        "react"
    ],
    "globals": {
        "chrome": "readonly" // Declare chrome as a read-only global
    },
    "rules": {
        "react/prop-types": 0,
        "react/jsx-no-target-blank": 0,
        "no-unused-vars": 0,
        "no-debugger": 0, // Turn off the rule that forbids debugger
        "no-undef": 0 // Turn off the rule that forbids undeclared variables
    }
};
