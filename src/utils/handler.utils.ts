import { ENCODING_BY_MNEMONIC, LEGACY_INSTRUCTIONS_ENCODING, R6_INSTRUCTIONS_ENCODING } from "@/constants/instructions.constants";
import { HandlerError, InstructionDescription } from "@/types/handler.types";
import { InstructionEncoding } from "@/types/instruction.types";
import { MipsVersion } from "@/types/version.types";

// Orden de búsqueda por versión: R6 primero en modo r6, legacy primero en los demás
function encodingsByVersion(version?: MipsVersion): ReadonlyArray<InstructionEncoding> {
    return version === 'r6'
        ? [...R6_INSTRUCTIONS_ENCODING, ...LEGACY_INSTRUCTIONS_ENCODING]
        : [...LEGACY_INSTRUCTIONS_ENCODING, ...R6_INSTRUCTIONS_ENCODING];
}

// Funcion que permite extraer del set general dada una condicion 
export function buildInstructionDescriptions(predicate: (encoding: InstructionEncoding) => boolean)
    : ReadonlyArray<InstructionDescription> {

    return Object.values(ENCODING_BY_MNEMONIC)
        .filter(predicate)
        .map(e => ({ mnemonic: e.mnemonic, opcode: e.opcode }));
}

export function getEncoding(mnemonic: string, handlerName: string, version:MipsVersion): InstructionEncoding {
    const ENCODINGS = version === 'r6' 
        ? [...R6_INSTRUCTIONS_ENCODING, ...LEGACY_INSTRUCTIONS_ENCODING]
        : [...LEGACY_INSTRUCTIONS_ENCODING, ...R6_INSTRUCTIONS_ENCODING];

    const encoding = ENCODINGS.find(e => e.mnemonic.toLowerCase() === mnemonic);

    if (!encoding)
        throw new HandlerError({ type: "UNKNOWN_MNEMONIC", message: `[${handlerName}] Encoding no encontrado para ${mnemonic}`});

    return encoding;
}

export function findEncodingByOpcode(opcode: string, predicate: (encoding: InstructionEncoding) => boolean, handlerName: string, version?: MipsVersion): InstructionEncoding {
    const encoding = encodingsByVersion(version).find(e => e.opcode === opcode && predicate(e));

    if (!encoding)
        throw new HandlerError({ type: "UNKNOWN_OPCODE", message: `[${handlerName}] opcode desconocido ${opcode}`});

    return encoding;
}