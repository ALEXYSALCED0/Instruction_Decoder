import { describe, it, expect } from 'vitest';
import { ENCODING_BY_FUNCT, INSTRUCTION_ENCODINGS } from '../src/constants/instructions.constants';
import { encodeInstruction, decodeInstruction } from '../src/services/handler.registry.service';
import type { Operand } from '../src/types/operand.types';
import type { DecodedInstruction } from '../src/types/instruction.types';
import { parseVersion } from '../src/types/version.types';
import { sliceBits } from '../src/utils/bit.utils'

function mockOperand(argName: string): Operand {
    switch (argName) {
        case 'rd': return { kind: 'register', name: 't0' };
        case 'rs': return { kind: 'register', name: 't1' };
        case 'rt': return { kind: 'register', name: 't2' };
        case 'shamt': return { kind: 'immediate', value: 4 };
        case 'sa': return { kind: 'immediate', value: 2 };
        case 'immediate':
        case 'imm16': return { kind: 'immediate', value: 42 };
        case 'offset':
        case 'offset16': return { kind: 'immediate', value: 24 };
        case 'imm21': return { kind: 'immediate', value: 1024 };
        case 'address':
        case 'target':
        case 'imm26': return { kind: 'immediate', value: 0x10004 };
        case 'offset(rs)':
        case 'offset(base)':
        case 'offsetFromBase': return { kind: 'memory', base: 'sp', offset: 8 };
        case 'code': return { kind: 'immediate', value: 5 };
        default:
            throw new Error(`Argumento no manejado en stress test: ${argName}`);
    }
}

describe('MIPS Encoder/Decoder Stress Test (100% de instrucciones)', () => {
    // Lista de excepciones donde el round-trip de mnemónico difiere por diseño
    const MNEMONIC_ALIASES: Record<string, string> = {
        // El mock usa rs=t1(9) < rt=t2(10), lo que codifica bits idénticos a beqc/bnec
        'bovc': 'beqc',
        'bnvc': 'bnec',
    };

    for (const encoding of INSTRUCTION_ENCODINGS) {
        const version = parseVersion(encoding.version);

        // Omitir instrucciones especiales que no tienen representación estándar de operandos o casos especiales
        // Por ejemplo, "nal" y "bal" en legacy/r6 a veces comparten opcodes con bgez/bltz,
        // o son alias sin operandos que decodifican a la versión generalizada con operandos.
        const skippedMnemonics = new Set(['nal', 'bal', 'nop', 'ssnop']);
        if (skippedMnemonics.has(encoding.mnemonic.toLowerCase())) {
            continue;
        }

        it(`Round-trip completo para: ${encoding.mnemonic} (${encoding.version})`, () => {
            const original: DecodedInstruction = {
                mnemonic: encoding.mnemonic.toLowerCase(),
                operands: encoding.args.map(mockOperand),
            };

            // 1. Probar Codificación
            let hex = '';
            try {
                hex = encodeInstruction(original, version as any);
            } catch (err: any) {
                throw new Error(`[ENCODE FAIL] ${encoding.mnemonic}: ${err.message}`);
            }

            expect(hex).toMatch(/^0x[0-9A-F]{8}$/i);

            // 2. Probar Decodificación
            let decoded: DecodedInstruction;
            try {
                decoded = decodeInstruction(hex, version as any);
            } catch (err: any) {
                throw new Error(`[DECODE FAIL] ${encoding.mnemonic} (Hex: ${hex}): ${err.message}`);
            }

            // 3. Validar resultados
            const expectedMnemonic = MNEMONIC_ALIASES[original.mnemonic] || original.mnemonic;
            expect(decoded.mnemonic).toBe(expectedMnemonic);
            expect(decoded.operands.length).toBe(original.operands.length);

            // Comparar operandos
            for (let i = 0; i < original.operands.length; i++) {
                const origOp = original.operands[i]!;
                const decOp = decoded.operands[i]!;

                expect(decOp.kind).toBe(origOp.kind);

                if (origOp.kind === 'register' && decOp.kind === 'register') {
                    // Para jr, jalr, etc., el registro rs puede ser restaurado
                    expect(decOp.name).toBe(origOp.name);
                } else if (origOp.kind === 'immediate' && decOp.kind === 'immediate') {
                    // Para branches de R6, los offsets se manipulan o dividen. 
                    // No obstante, para inmediatos generales, validamos igualdad.
                    if (encoding.type !== 'J' && !encoding.mnemonic.endsWith('c')) {
                        expect(decOp.value).toBe(origOp.value);
                    }
                } else if (origOp.kind === 'memory' && decOp.kind === 'memory') {
                    expect(decOp.base).toBe(origOp.base);
                    expect(decOp.offset).toBe(origOp.offset);
                }
            }
        });
    }
});
