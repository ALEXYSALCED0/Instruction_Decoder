# MIPS Instruction Decoder & Encoder

A modular, data-driven MIPS assembler and disassembler written in TypeScript. It converts MIPS assembly into 32-bit machine code (hex) and back, supporting both legacy MIPS (I/II) and MIPS R6.

The project is built around two principles: the JSON instruction tables are the single source of truth (SOT), and every instruction family lives in its own self-contained handler. Adding a new instruction means editing data, not logic.

---

## 📂 Documentation & Guides

For deep dives into architecture, testing, and other topics, refer to the following documents:

* 📖 **[Technical Documentation (DOCS.md)](file:///Users/alexysalcedo/Documents/GitHub/Instruction_Decoder/DOCS.md)**: Details the architecture, pipeline stages (assembly parser, instruction parser, handler registry, etc.), supported instructions, utility functions, error handling, and design choices.
* 🧪 **[Testing Strategy & Suites (TESTING.md)](file:///Users/alexysalcedo/Documents/GitHub/Instruction_Decoder/TESTING.md)**: Outlines the testing strategy, describes the 12 specific test suites (integration, E2E, boundary, performance, stress, regression, etc.), and lists commands for running them.

---

## 🚀 Quick Start

Here is a simple example of how to use the pipeline to compile assembly to hex and back:

```typescript
import { parseAssembly }             from './src/services/assembly-parser.service/assembly-parser.service';
import { parseInstructions }         from './src/services/instruction.parser.service';
import { encodeInstruction, 
         decodeInstruction }         from './src/services/handler.registry.service';
import { formatDecodedInstruction }   from './src/utils/format.utils';

// 1. Parse raw assembly text into clean, validated instruction strings
const { instructions, errors } = parseAssembly(`
    addiu $t0, $zero, 10
    loop: add $t1, $t1, $t0
          addiu $t0, $t0, -1
          bne $t0, $zero, loop
`);

if (errors.length > 0) {
    console.error("Syntax errors found:", errors);
} else {
    // 2. Turn each clean string into a DecodedInstruction
    const decoded = parseInstructions(instructions);

    // 3. Encode to hex (using MIPS R6 version)
    const hexes = decoded.map(d => encodeInstruction(d, 'r6'));
    console.log("Encoded Hex values:", hexes);
    // → ['0x2408000A', '0x01284820', ...]

    // 4. Decode hex back to a DecodedInstruction
    const back = decodeInstruction('0x012A4020', 'r6');

    // 5. Render it as readable assembly
    const asm = formatDecodedInstruction(back);
    console.log("Decoded Assembly:", asm);
    // → 'add $t0 $t1 $t2'
}
```

---

## 🛠️ How To Run and Build

This project uses **pnpm** as its primary package manager. If you are using `npm`, please ensure you check project compatibility configurations.

### 1. Development Mode (Direct Execution)
You can execute TypeScript files (such as `src/main.ts`) directly without manual compilation by using `tsx`:

```bash
pnpm exec tsx src/main.ts
```
*Or using npx:*
```bash
npx tsx src/main.ts
```

### 2. Production Mode (Compile & Run)
1. **Compile the project** to JavaScript:
   ```bash
   pnpm exec tsc
   ```
   *(This outputs compiled files to the `dist/` directory)*

2. **Run the compiled entry point**:
   ```bash
   node dist/main.js
   ```

---

## 🧪 Quick Test Run

To execute the entire test suite using **Vitest**:

```bash
pnpm test run
```
*Or with npm:*
```bash
npm run test -- --run
```

For more detailed test options (e.g. watch mode, coverage reporting, running specific test files), please see [TESTING.md](file:///Users/alexysalcedo/Documents/GitHub/Instruction_Decoder/TESTING.md).
