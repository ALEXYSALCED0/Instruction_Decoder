# MIPS Instruction Decoder & Encoder

This project is a tool and library written in **TypeScript** designed to perform the complete workflow of **parsing, encoding, decoding, and formatting** MIPS architecture instructions.

It supports both **MIPS I (Legacy)** and **MIPS R6** instruction sets.

---

## Prerequisites

Before getting started, make sure you have the following installed:
* [Node.js](https://nodejs.org/) (Version 18 or higher recommended)
* [pnpm](https://pnpm.io/) (The package manager used in this project)

---

## Dependency Installation

To install all the necessary project dependencies, open your terminal in the project's root folder and run:

```bash
pnpm install
```

---

## How To Run The Tests

This project uses **Vitest** as its test runner. Here are the commands for different execution modes:

### 1. Run all tests once (CI/CD / Quick Verification)
```bash
pnpm test run
```

### 2. Run tests in watch mode
Tests will run automatically every time you edit or save a file:
```bash
pnpm test
```

### 3. Run a specific test file
If you are working on a specific feature and want to test only that file (e.g., `e2e.test.ts`):
```bash
pnpm test test/e2e.test.ts --run
```

### 4. Generate code coverage reports
To see how much of the code is covered by unit tests:
```bash
pnpm exec vitest run --coverage
```

---

## How To Run and Build The Code

### Option A: Direct execution in development (No manual compilation required)
You can directly run any TypeScript file (such as the entry point `src/main.ts`) using `tsx`:

```bash
npx tsx src/main.ts
```

### Option B: Standard compilation and execution (Production)

1. **Compile the project** to native JavaScript:
   ```bash
   pnpm exec tsc
   ```
   *(This will generate the output files inside the `dist/` directory)*

2. **Execute the compiled file**:
   ```bash
   node dist/main.js
   ```

---

## Main Project Structure

The project is structured as follows:

* 📂 **`src/`** — Main source code.
  * 📂 `src/constants/` — Encoding constant mappings for MIPS R6 and Legacy.
  * 📂 `src/services/` — Assembly parsers, instruction parsers, and registry services.
  * 📂 `src/utils/` — Helper functions (bit manipulation, registers, operand formatters).
  * 📄 `src/main.ts` — Main entry point.
* 📂 **`test/`** — Test suites including unit, integration, performance, stress, and E2E tests.
* 📄 `tsconfig.json` — TypeScript compiler configuration.
* 📄 `vitest.config.ts` — Vitest configuration file.
