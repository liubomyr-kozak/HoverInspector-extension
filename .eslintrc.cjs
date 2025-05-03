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
        "chrome": "readonly" // Додаємо chrome як глобальну змінну (тільки для читання)
    },
    "rules": {
        "react/prop-types": 0,
        "react/jsx-no-target-blank": 0,
        "no-unused-vars": 0,
        "no-debugger": 0, // Вимикаємо правило, що забороняє debugger
        "no-undef": 0 // Вимикаємо правило, що забороняє неоголошені змінні
    }
};
