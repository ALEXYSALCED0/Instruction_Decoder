/* 
    instructions.constants usan los JSON de data/ como
    source of truth. Este file resume el casteo
*/

import legacyRaw from '@/data/mips-instructions.json';
import r6Raw from '@/data/mips-r6-instructions.json';

import type { InstructionEncoding } from '@/types/instruction.types';
import { parseVersion } from '@/types/version.types';

/* 
    TODO: TypeGuard para validar que los datos raw se parseen bien. 
*/

export const LEGACY_INSTRUCTIONS_ENCODING = legacyRaw as ReadonlyArray<InstructionEncoding>;
export const R6_INSTRUCTIONS_ENCODING = r6Raw as ReadonlyArray<InstructionEncoding>;

export const INSTRUCTION_ENCODINGS: ReadonlyArray<InstructionEncoding> = [
    ...LEGACY_INSTRUCTIONS_ENCODING,
    ...R6_INSTRUCTIONS_ENCODING,
];

export const ENCODING_BY_MNEMONIC: Readonly<Record<string, InstructionEncoding>> =
    Object.fromEntries(
        INSTRUCTION_ENCODINGS.map(instruction => [
            instruction.mnemonic.toLowerCase(),
            instruction,
        ]),
    );

export const ENCODING_BY_FUNCT: Readonly<Record<string, InstructionEncoding>> =
    Object.fromEntries(
        INSTRUCTION_ENCODINGS
            .filter(instruction => instruction.funct !== undefined)
            .map(instruction => [
                `${instruction.funct}:${instruction.shamt ?? '*'}:${parseVersion(instruction.version)}`,
                instruction,
            ]),
    );