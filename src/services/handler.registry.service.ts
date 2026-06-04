import type { DecodedInstruction } from "@/types/instruction.types";
import type { MipsVersion }        from "@/types/version.types";
import { HandlerError }            from "@/types/handler.types";
import { hexToBits, bitsToHex }    from "@/utils/bit.utils";
import { LEGACY_INSTRUCTIONS_ENCODING, R6_INSTRUCTIONS_ENCODING } from "@/constants/instructions.constants";
import { rTypeHandler }  from "@/handlers/r-type.handler";
import { iTypeHandler }  from "@/handlers/i-type.handler";
import { memoryHandler } from "@/handlers/memory.handler";
import { branchHandler } from "@/handlers/branch.handler/branch.handler";
import { jTypeHandler }  from "@/handlers/j-type.handler";

// ─── Generalizador de Handlers, aqui se da que handler hace que ────────

const HANDLERS = [ rTypeHandler, iTypeHandler, memoryHandler, branchHandler, jTypeHandler ] as const;

const BY_MNEMONIC        = new Map<string, typeof HANDLERS[number]>();
const BY_OPCODE_LEGACY   = new Map<string, typeof HANDLERS[number]>();
const BY_OPCODE_R6       = new Map<string, typeof HANDLERS[number]>();

// Primer paso: mapear cada mnemonic a su handler
for (const handler of HANDLERS) {
    for (const { mnemonic } of handler.instructions) {
        BY_MNEMONIC.set(mnemonic.toLowerCase(), handler);
    }
}

// Segundo paso: mapas de opcode
for (const enc of LEGACY_INSTRUCTIONS_ENCODING) {
    const handler = BY_MNEMONIC.get(enc.mnemonic.toLowerCase());
    if (handler && !BY_OPCODE_LEGACY.has(enc.opcode))
        BY_OPCODE_LEGACY.set(enc.opcode, handler);
}
for (const enc of R6_INSTRUCTIONS_ENCODING) {
    const handler = BY_MNEMONIC.get(enc.mnemonic.toLowerCase());
    if (handler && !BY_OPCODE_R6.has(enc.opcode))
        BY_OPCODE_R6.set(enc.opcode, handler);
}

export const encodeInstruction = ( instruction : DecodedInstruction, version : MipsVersion ): string => {
    const handler = BY_MNEMONIC.get(instruction.mnemonic);

    if (!handler)
        throw new HandlerError({type:'UNKNOWN_MNEMONIC', message: `[Registry] No hay handler para '${instruction.mnemonic}'` });

    const bits32 = handler.encode(instruction, version);
    return bitsToHex(bits32);
};

export const decodeInstruction = ( hex: string, version: MipsVersion): DecodedInstruction => {
    const bits32  = hexToBits(hex).padStart(32, '0');
    const opcode  = bits32.slice(0, 6);

    const opcodeMap = version === 'r6' ? BY_OPCODE_R6 : BY_OPCODE_LEGACY;
    const handler   = opcodeMap.get(opcode);

    if (!handler)
        throw new HandlerError({ type:'UNKNOWN_OPCODE', message: `[Registry] No hay handler para opcode ${opcode} (${hex})` });

    return handler.decode(bits32, version);
};
