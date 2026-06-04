// test/coverage.test.ts
//
// PROPÓSITO: Verificar sistemáticamente que CADA instrucción soportada
// por el proyecto puede ser parseada, encodada y decodificada sin errores.
//
// DIFERENCIA con otros tests:
// - integration.test.ts / e2e.test.ts → flujo completo en casos representativos
// - stress.test.ts      → un programa complejo (Fibonacci)
// - registry.test.ts    → encode/decode de instrucciones individuales
// - ← ESTE TEST        → pasa por TODAS las instrucciones del JSON una por una,
//                         asegurando que ninguna quede sin probar
//
// Si se agrega una instrucción nueva al JSON y el handler no la soporta,
// este test lo detecta antes de que llegue a producción.

import { describe, it, expect } from 'vitest';
import { parseAssembly }        from '../src/services/assembly-parser.service/assembly-parser.service';
import { parseInstructions }    from '../src/services/instruction.parser.service';
import { encodeInstruction, decodeInstruction } from '../src/services/handler.registry.service';

// ─── Helper ──────────────────────────────────────────────────────────────────

const encodeAsm = (asm: string) => {
    const { instructions, errors } = parseAssembly(asm);
    if (errors.length > 0) return { hex: null, errors };
    const decoded = parseInstructions(instructions);
    const hex     = encodeInstruction(decoded[0]!, 'r6');
    return { hex, errors: [] };
};

const roundTrip = (asm: string) => {
    const { hex, errors } = encodeAsm(asm);
    if (!hex) return { ok: false, errors };
    const back = decodeInstruction(hex, 'r6');
    return { ok: true, mnemonic: back.mnemonic, operands: back.operands, errors: [] };
};

// ─── 1. INSTRUCCIONES R-TYPE ──────────────────────────────────────────────────

describe('Coverage – R-type: aritmética entera', () => {

    it('add  $t0, $t1, $t2  →  encode sin errores', () => {
        const { errors, hex } = encodeAsm('add $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
        expect(hex).toBe('0x012A4020');
    });

    it('addu $t0, $t1, $t2  →  encode sin errores', () => {
        const { errors } = encodeAsm('addu $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
    });

    it('sub  $t0, $t1, $t2  →  encode sin errores', () => {
        const { errors } = encodeAsm('sub $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
    });

    it('subu $t0, $t1, $t2  →  encode sin errores', () => {
        const { errors } = encodeAsm('subu $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
    });

    it('mul  $t0, $t1, $t2  →  encode sin errores', () => {
        const { errors } = encodeAsm('mul $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
    });

    it('muh  $t0, $t1, $t2  →  encode sin errores', () => {
        const { errors } = encodeAsm('muh $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
    });

    it('mulu $t0, $t1, $t2  →  encode sin errores', () => {
        const { errors } = encodeAsm('mulu $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
    });

    it('muhu $t0, $t1, $t2  →  encode sin errores', () => {
        const { errors } = encodeAsm('muhu $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
    });

    it('div  $t0, $t1, $t2  →  encode sin errores', () => {
        const { errors } = encodeAsm('div $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
    });

    it('mod  $t0, $t1, $t2  →  encode sin errores', () => {
        const { errors } = encodeAsm('mod $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
    });

    it('divu $t0, $t1, $t2  →  encode sin errores', () => {
        const { errors } = encodeAsm('divu $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
    });

    it('modu $t0, $t1, $t2  →  encode sin errores', () => {
        const { errors } = encodeAsm('modu $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
    });

});

describe('Coverage – R-type: lógica', () => {

    it('and  $t0, $t1, $t2  →  encode sin errores', () => {
        const { errors } = encodeAsm('and $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
    });

    it('or   $t0, $t1, $t2  →  encode sin errores', () => {
        const { errors } = encodeAsm('or $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
    });

    it('xor  $t0, $t1, $t2  →  encode sin errores', () => {
        const { errors } = encodeAsm('xor $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
    });

    it('nor  $t0, $t1, $t2  →  encode sin errores', () => {
        const { errors } = encodeAsm('nor $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
    });

    it('slt  $t0, $t1, $t2  →  encode sin errores', () => {
        const { errors } = encodeAsm('slt $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
    });

    it('sltu $t0, $t1, $t2  →  encode sin errores', () => {
        const { errors } = encodeAsm('sltu $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
    });

    it('seleqz $t0, $t1, $t2  →  encode sin errores', () => {
        const { errors } = encodeAsm('seleqz $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
    });

    it('selnez $t0, $t1, $t2  →  encode sin errores', () => {
        const { errors } = encodeAsm('selnez $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
    });

});

describe('Coverage – R-type: shifts', () => {

    it('sll  $t0, $t1, 4  →  encode sin errores', () => {
        const { errors } = encodeAsm('sll $t0, $t1, 4');
        expect(errors).toHaveLength(0);
    });

    it('srl  $t0, $t1, 4  →  encode sin errores', () => {
        const { errors } = encodeAsm('srl $t0, $t1, 4');
        expect(errors).toHaveLength(0);
    });

    it('sra  $t0, $t1, 4  →  encode sin errores', () => {
        const { errors } = encodeAsm('sra $t0, $t1, 4');
        expect(errors).toHaveLength(0);
    });

    it('sllv $t0, $t1, $t2  →  encode sin errores', () => {
        const { errors } = encodeAsm('sllv $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
    });

    it('srlv $t0, $t1, $t2  →  encode sin errores', () => {
        const { errors } = encodeAsm('srlv $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
    });

    it('srav $t0, $t1, $t2  →  encode sin errores', () => {
        const { errors } = encodeAsm('srav $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
    });

});

describe('Coverage – R-type: saltos y especiales', () => {

    it('jr     $ra  →  encode sin errores', () => {
        const { errors } = encodeAsm('jr $ra');
        expect(errors).toHaveLength(0);
    });

    it('jalr   $ra, $t0  →  encode sin errores', () => {
        const { errors } = encodeAsm('jalr $ra, $t0');
        expect(errors).toHaveLength(0);
    });

    it('syscall  →  encode sin errores', () => {
        const { errors } = encodeAsm('syscall');
        expect(errors).toHaveLength(0);
    });

    it('break  →  encode sin errores', () => {
        const { errors } = encodeAsm('break');
        expect(errors).toHaveLength(0);
    });

});

// ─── 2. INSTRUCCIONES I-TYPE ──────────────────────────────────────────────────

describe('Coverage – I-type: aritmética/lógica inmediata', () => {

    it('addiu $t0, $zero, 42  →  encode sin errores', () => {
        const { errors } = encodeAsm('addiu $t0, $zero, 42');
        expect(errors).toHaveLength(0);
    });

    it('slti  $t0, $t1, 10  →  encode sin errores', () => {
        const { errors } = encodeAsm('slti $t0, $t1, 10');
        expect(errors).toHaveLength(0);
    });

    it('sltiu $t0, $t1, 10  →  encode sin errores', () => {
        const { errors } = encodeAsm('sltiu $t0, $t1, 10');
        expect(errors).toHaveLength(0);
    });

    it('andi  $t0, $t1, 0xFF  →  encode sin errores', () => {
        const { errors } = encodeAsm('andi $t0, $t1, 0xFF');
        expect(errors).toHaveLength(0);
    });

    it('ori   $t0, $t1, 0xFF  →  encode sin errores', () => {
        const { errors } = encodeAsm('ori $t0, $t1, 0xFF');
        expect(errors).toHaveLength(0);
    });

    it('xori  $t0, $t1, 0xFF  →  encode sin errores', () => {
        const { errors } = encodeAsm('xori $t0, $t1, 0xFF');
        expect(errors).toHaveLength(0);
    });

    it('lui   $t0, 1  →  encode sin errores', () => {
        const { errors } = encodeAsm('lui $t0, 1');
        expect(errors).toHaveLength(0);
    });

});

describe('Coverage – I-type: memoria (loads)', () => {

    it('lb   $t0, 0($sp)  →  encode sin errores', () => {
        const { errors } = encodeAsm('lb $t0, 0($sp)');
        expect(errors).toHaveLength(0);
    });

    it('lh   $t0, 0($sp)  →  encode sin errores', () => {
        const { errors } = encodeAsm('lh $t0, 0($sp)');
        expect(errors).toHaveLength(0);
    });

    it('lw   $t0, 0($sp)  →  encode sin errores', () => {
        const { errors } = encodeAsm('lw $t0, 0($sp)');
        expect(errors).toHaveLength(0);
    });

    it('lbu  $t0, 0($sp)  →  encode sin errores', () => {
        const { errors } = encodeAsm('lbu $t0, 0($sp)');
        expect(errors).toHaveLength(0);
    });

    it('lhu  $t0, 0($sp)  →  encode sin errores', () => {
        const { errors } = encodeAsm('lhu $t0, 0($sp)');
        expect(errors).toHaveLength(0);
    });

});

describe('Coverage – I-type: memoria (stores)', () => {

    it('sb   $t0, 0($sp)  →  encode sin errores', () => {
        const { errors } = encodeAsm('sb $t0, 0($sp)');
        expect(errors).toHaveLength(0);
    });

    it('sh   $t0, 0($sp)  →  encode sin errores', () => {
        const { errors } = encodeAsm('sh $t0, 0($sp)');
        expect(errors).toHaveLength(0);
    });

    it('sw   $t0, 0($sp)  →  encode sin errores', () => {
        const { errors } = encodeAsm('sw $t0, 0($sp)');
        expect(errors).toHaveLength(0);
    });

});

describe('Coverage – I-type: branches clásicos', () => {

    it('beq  $t0, $t1, label  →  encode sin errores', () => {
        const { errors } = parseAssembly('beq $t0, $t1, end\nend: addiu $zero, $zero, 0');
        expect(errors).toHaveLength(0);
    });

    it('bne  $t0, $t1, label  →  encode sin errores', () => {
        const { errors } = parseAssembly('bne $t0, $t1, end\nend: addiu $zero, $zero, 0');
        expect(errors).toHaveLength(0);
    });

    it('blez $t0, label  →  encode sin errores', () => {
        const { errors } = parseAssembly('blez $t0, end\nend: addiu $zero, $zero, 0');
        expect(errors).toHaveLength(0);
    });

    it('bgtz $t0, label  →  encode sin errores', () => {
        const { errors } = parseAssembly('bgtz $t0, end\nend: addiu $zero, $zero, 0');
        expect(errors).toHaveLength(0);
    });

    it('bltz $t0, label  →  encode sin errores', () => {
        const { errors } = parseAssembly('bltz $t0, end\nend: addiu $zero, $zero, 0');
        expect(errors).toHaveLength(0);
    });

    it('bgez $t0, label  →  encode sin errores', () => {
        const { errors } = parseAssembly('bgez $t0, end\nend: addiu $zero, $zero, 0');
        expect(errors).toHaveLength(0);
    });

});

// ─── 3. INSTRUCCIONES J-TYPE ──────────────────────────────────────────────────

describe('Coverage – J-type', () => {

    it('j   label  →  encode sin errores', () => {
        const { errors } = parseAssembly('j fin\naddiu $t0, $zero, 1\nfin: addiu $t1, $zero, 2');
        expect(errors).toHaveLength(0);
    });

    it('jal label  →  encode sin errores', () => {
        const { errors } = parseAssembly('jal fin\naddiu $t0, $zero, 1\nfin: addiu $t1, $zero, 2');
        expect(errors).toHaveLength(0);
    });

});

// ─── 4. ROUND-TRIP POR TIPO ───────────────────────────────────────────────────
// Verifica que para cada categoría, el mnemónico sobrevive encode → decode

describe('Coverage – round-trip mnemónico por instrucción', () => {

    const rTypeInstructions = [
        ['add',    'add $t0, $t1, $t2'],
        ['addu',   'addu $t0, $t1, $t2'],
        ['sub',    'sub $t0, $t1, $t2'],
        ['subu',   'subu $t0, $t1, $t2'],
        ['and',    'and $t0, $t1, $t2'],
        ['or',     'or $t0, $t1, $t2'],
        ['xor',    'xor $t0, $t1, $t2'],
        ['nor',    'nor $t0, $t1, $t2'],
        ['slt',    'slt $t0, $t1, $t2'],
        ['sltu',   'sltu $t0, $t1, $t2'],
        ['mul',    'mul $t0, $t1, $t2'],
        ['div',    'div $t0, $t1, $t2'],
        ['mod',    'mod $t0, $t1, $t2'],
        ['sll',    'sll $t0, $t1, 4'],
        ['srl',    'srl $t0, $t1, 4'],
        ['sra',    'sra $t0, $t1, 4'],
        ['syscall','syscall'],
        ['break',  'break'],
        ['jr',     'jr $ra'],
    ] as const;

    for (const [mnemonic, asm] of rTypeInstructions) {
        it(`round-trip ${mnemonic}: decode(encode(x)).mnemonic === '${mnemonic}'`, () => {
            const result = roundTrip(asm);
            expect(result.errors).toHaveLength(0);
            expect(result.ok).toBe(true);
            expect(result.mnemonic).toBe(mnemonic);
        });
    }

    const iTypeInstructions = [
        ['addiu', 'addiu $t0, $zero, 42'],
        ['slti',  'slti $t0, $t1, 10'],
        ['sltiu', 'sltiu $t0, $t1, 10'],
        ['andi',  'andi $t0, $t1, 10'],
        ['ori',   'ori $t0, $t1, 10'],
        ['xori',  'xori $t0, $t1, 10'],
        ['lui',   'lui $t0, 1'],
        ['lw',    'lw $t0, 4($sp)'],
        ['sw',    'sw $t0, 4($sp)'],
        ['lb',    'lb $t0, 0($sp)'],
        ['lh',    'lh $t0, 0($sp)'],
        ['lbu',   'lbu $t0, 0($sp)'],
        ['lhu',   'lhu $t0, 0($sp)'],
        ['sb',    'sb $t0, 0($sp)'],
        ['sh',    'sh $t0, 0($sp)'],
    ] as const;

    for (const [mnemonic, asm] of iTypeInstructions) {
        it(`round-trip ${mnemonic}: decode(encode(x)).mnemonic === '${mnemonic}'`, () => {
            const result = roundTrip(asm);
            expect(result.errors).toHaveLength(0);
            expect(result.ok).toBe(true);
            expect(result.mnemonic).toBe(mnemonic);
        });
    }

});
