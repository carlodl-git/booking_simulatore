const nextJest = require("next/jest")

const createJestConfig = nextJest({
  // Fornisci il path alla tua Next.js app per caricare next.config.js e i file .env
  dir: "./",
})

// Aggiungi qualsiasi configurazione Jest personalizzata
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
}

// createJestConfig è esportato in questo modo per garantire che next/jest possa caricare la configurazione di Next.js
module.exports = createJestConfig(customJestConfig)

