# MIPS Instruction Decoder & Encoder - Technical Documentation

This document provides a detailed overview of the system architecture, core concepts, execution pipelines, and supported instruction set architectures (ISA) for the MIPS Instruction Decoder & Encoder.

---

## Architecture & Functionality

### High-Level Flow

```
                          ENCODE  (assembly → hex)
 ─────────────────────────────────────────────────────────────────
 
 raw assembly text
       │
       ▼
 parseAssembly()              →  string[]  (clean, validated, labels resolved)
       │
       ▼
 parseInstructions()          →  DecodedInstruction[]
       │
       ▼
 encodeInstruction()          →  Registry routes by mnemonic
       │                            │
       │                            ▼
       │                       handler.encode(instruction, version)  →  bits32
       │                            │
       ▼                            ▼
 hex string  ◄──────────────────  bitsToHex()
 
 
                           DECODE  (hex → assembly)
 ─────────────────────────────────────────────────────────────────
 
 hex string
       │
       ▼
 decodeInstruction()          →  Registry routes by opcode + version
       │                            │
       │                            ▼
       │                       handler.decode(bits32, version)  →  DecodedInstruction
       │
       ▼
 formatDecodedInstruction()   →  readable assembly string
```

### Layered Design

The system is split into clearly separated layers, each with a single responsibility. Nothing flows upward — lower layers never import from higher ones.

| Layer | Responsibility | Knows about |
| :--- | :--- | :--- |
| **`constants/`** | Static data: registers, opcodes, funct codes, instruction tables | nothing (pure data) |
| **`types/`** | Pure type shapes | nothing |
| **`utils/`** | Pure helper functions (bit math, register lookup, arg normalization) | constants + types |
| **`handlers/`** | Encode/decode for one instruction family each | utils + constants |
| **`services/`** | Orchestration: registry, parsers, formatters | everything below |

### The Source-of-Truth Principle

Two JSON files under `data/` define every supported instruction:

- `mips-instructions.json` — legacy MIPS I/II
- `mips-r6-instructions.json` — MIPS R6

Each entry declares the mnemonic, format type, opcode, optional funct/shamt, the ordered list of operand roles (`args`), and the ISA version. The rest of the system derives everything from these tables. No instruction-specific logic is hardcoded in the handlers — they read the `args` array and act accordingly.

```jsonc
{
  "mnemonic": "add",
  "type": "R",
  "opcode": "000000",
  "funct": "100000",
  "version": "MIPS I",
  "args": ["rd", "rs", "rt"]
}
```

---

## Core Concepts

### DecodedInstruction

The central data structure that flows between layers. It is ISA-text-agnostic — it holds a mnemonic and a list of typed operands, never raw strings or raw bits.

```typescript
type DecodedInstruction = {
    readonly mnemonic : Mnemonic;
    readonly operands : ReadonlyArray<Operand>;
};

type Operand =
    | { kind: 'register';  name: RegisterName }
    | { kind: 'immediate'; value: number }
    | { kind: 'memory';    base: string; offset: number };
```

`encode` consumes a `DecodedInstruction` and produces a 32-bit binary string. `decode` does the reverse. The handler is the only place that knows how operands map to bit fields.

### Versions

Raw ISA names from the JSON (`"MIPS I"`, `"MIPS R6"`, etc.) are normalized into a small runtime enum:

```typescript
type MipsVersion = 'legacy' | 'mips1' | 'mips2' | 'r6';
```

`parseVersion()` performs the mapping. Version awareness matters because several encodings collide across ISAs — for example `div` legacy and `mod` R6 share the same funct code, and `addi` legacy shares opcode `001000` with `beqc` R6. The registry and lookup helpers always disambiguate by version.

---

## Pipeline Stages

### Stage 1 — Assembly Parser (`parseAssembly`)

Turns raw multi-line assembly into clean, validated instruction strings. Runs in three internal passes:

| Pass | File | Description |
| :--- | :--- | :--- |
| **Parse lines** | `01_input.parser` | Strips comments/directives, extracts labels, records each label's address (`BASE_ADDRESS + index*4`), splits mnemonic and raw operands. |
| **Validate operands** | `02_operand.validate` | Checks operand count and type against the expectations derived from each instruction's `args`. Range-checks immediates, shift amounts, and memory offsets. |
| **Resolve & format** | `03_label.solver` + `04_operand.format` | Converts label references into numeric branch/jump offsets, then renders each instruction back to a normalized space-separated string. |

The orchestrator stops at the first pass that produces errors and returns them all at once.

### Stage 2 — Instruction Parser (`parseInstructions`)

Bridges the gap between the assembly parser's clean strings and the handlers' `DecodedInstruction` input. It tokenizes each line and classifies tokens into register / immediate / memory operands. The memory case is special: a numeric token immediately followed by a register token (`"4 $sp"`) is folded into a single `memory` operand.

### Stage 3 — Handler Registry (`encodeInstruction` / `decodeInstruction`)

The dispatch core. At module load it builds three maps:

- `BY_MNEMONIC` — mnemonic → handler (used for encode)
- `BY_OPCODE_LEGACY` — opcode → handler, legacy ISA (used for decode)
- `BY_OPCODE_R6` — opcode → handler, R6 ISA (used for decode)

Two separate opcode maps are required because the same opcode can belong to different instruction families across versions. Encode routes purely by mnemonic; decode routes by opcode within the selected version.

### Stage 4 — Handlers

Each handler is a typed object satisfying `InstructionHandler` and owns exactly one instruction family. They contain no per-mnemonic `if/else` chains — behavior is driven by the `args` field from the SOT.

---

## ISA — Supported Instructions

### R-type (opcode `000000`, differentiated by funct + shamt)

Arithmetic/logical (`add`, `addu`, `sub`, `subu`, `and`, `or`, `xor`, `nor`, `slt`, `sltu`), shifts (`sll`, `srl`, `sra`, `sllv`, `srlv`, `srav`), jumps (`jr`, `jalr`), system (`syscall`, `break`), legacy HI/LO and mul/div (`mfhi`, `mflo`, `mthi`, `mtlo`, `mult`, `multu`, `div`, `divu`), legacy traps (`teq`, `tge`, `tgeu`, `tlt`, `tltu`, `tne`), and R6 arithmetic (`mul`, `muh`, `mulu`, `muhu`, `mod`, `modu`, `seleqz`, `selnez`, `lsa`).

R6 multiply/divide instructions reuse legacy funct codes and are disambiguated by a fixed `shamt` value (see `SHAMT_R6`).

### I-type (differentiated by opcode)

`addi` (legacy), `addiu`, `slti`, `sltiu`, `andi`, `ori`, `xori`, `lui`, and R6 `aui`. In R6, `lui` is `aui` with `rs = 00000` — the decoder restores the `lui` mnemonic for that case.

### Memory (loads/stores)

`lw`, `sw`, `lb`, `lbu`, `lh`, `lhu`, `sb`, `sh`. Encoded as `opcode | rs(base) | rt | offset16`, with the offset treated as a signed 16-bit value.

### Branch / REGIMM

Standard branches (`beq`, `bne`, `blez`, `bgtz`), REGIMM branches (`bltz`, `bgez`, `bal`, `nal`), and R6 compact branches (`beqzc`, `bnezc`, `beqc`, `bnec`, `bltc`, `bgec`, and the rest of the compact family).

### J-type

`j`, `jal`, and R6 compact `bc`, `balc`, encoded with a 26-bit address/offset field.

---

## Auxiliary Functions

### `bit.utils.ts`

Pure bit-level helpers, the base layer with no domain dependencies.

```typescript
hexToBits(hex)               // "0x..." → binary string
bitsToHex(bits)              // binary string → "0x..." (HexValue)
constToBits(value, width)    // number → fixed-width unsigned binary string
bitsToUnsignedNum(bits)      // binary → unsigned number
bitsToSignedNum(bits, width) // binary → signed (two's-complement) number
sliceBits(bits32)            // 32-bit word → { opcode, rs, rt, rd, shamt, funct, imm16, imm21, imm26 }
```

### `register.utils.ts`

```typescript
isRegisterToken(token)   // type guard: "$t0" form, valid name
regNameToBits(name)      // 't0' → '01000'
regBitsToName(bits)      // '01000' → 't0'
```

### `operands.util.ts`

```typescript
regToOperand(name)              // → RegisterOperand
immediateToOperand(value)       // → ImmediateOperand
tokenToOperand(token, next?)    // token(s) → { operand, consumed }
```

### `args.utils.ts`

Normalizes the raw `args` strings from the JSON (which use names like `"immediate"`, `"offset(rs)"`, `"address"`) into the canonical `InstructionArg` union, then maps each to an `OperandExpectation` the validator understands.

### `handler.utils.ts`

Shared helpers used by every handler:

```typescript
buildInstructionDescriptions(predicate)  // build the handler's instruction list from the SOT
getEncoding(mnemonic, handler, version)  // version-aware mnemonic → encoding lookup
findEncodingByOpcode(opcode, predicate, handler, version?)  // version-aware opcode lookup
```

`getEncoding` searches the version-appropriate table first (R6-first in R6 mode, legacy-first otherwise), which is what resolves the `div`/`mod` and `addi`/`beqc` collisions.

### `mnemonics.utils.ts`

Derives mnemonic sets from the SOT instead of hardcoding them:

```typescript
getMnemonicsByType('R')                       // all R-type mnemonics
getMnemonicsByArgs(['offset16', 'imm21'])     // all mnemonics whose args include any of these
```

These feed the `set.constants.ts` groupings (`R_TYPE_MNEMONICS`, `BRANCH_MNEMONICS`, etc.) that handlers use to claim their instructions.

---

## Error Handling

All failures throw a structured `HandlerError` carrying a typed `HandlerErrorType`:

```typescript
type HandlerErrorType =
    | 'UNKNOWN_MNEMONIC' | 'UNKNOWN_OPCODE' | 'UNKNOWN_FUNCT'
    | 'INVALID_REGISTER' | 'INVALID_IMMEDIATE'
    | 'INVALID_ARGS'     | 'VERSION_MISMATCH';
```

The assembly parser, by contrast, collects errors as strings and returns them in the `ParseResult` rather than throwing — so a whole program can be validated in one pass and every problem reported at once.

---

## Adding a New Instruction

Because the SOT drives everything, most additions touch only data:

1. **Add a row** to the appropriate JSON file with `mnemonic`, `type`, `opcode`, optional `funct`/`shamt`, `version`, and the ordered `args`.
2. **If it belongs to an existing family**, you are done — the handler reads its `args` and the registry picks it up automatically.
3. **If it is a brand-new family**, create one handler file exporting an object that satisfies `InstructionHandler`, and add it to the `HANDLERS` array in the registry. No existing handler is touched (Open/Closed).

---

## Design Notes

- **`>>> 0`** is used in `constToBits` to enforce 32-bit unsigned semantics when converting numbers to binary, so negative immediates encode correctly in two's-complement.
- **Signed vs unsigned decode** — memory offsets and most I-type immediates are decoded as signed 16-bit values via `bitsToSignedNum`.
- **Operand order** — the assembly parser preserves the order the user wrote. The handler is responsible for mapping that order onto the correct bit fields using the `args` list, so the parser never needs ISA knowledge.
- **`lui` / `aui`** — these share opcode `001111`. On decode, `rs = 00000` is rendered as `lui`, otherwise `aui`.
- **Version collisions** — `div`/`mod`, `divu`/`modu`, `addi`/`beqc` and several compact-branch opcodes overlap between legacy and R6. The version-keyed `ENCODING_BY_FUNCT` map and the dual opcode maps in the registry keep them apart.
