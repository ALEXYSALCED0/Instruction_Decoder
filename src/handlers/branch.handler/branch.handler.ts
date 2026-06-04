import { ENCODING_BY_MNEMONIC } from "@/constants/instructions.constants";
import { HandlerError, type InstructionHandler } from "@/types/handler.types";
import type { DecodedInstruction } from "@/types/instruction.types";
import type { MipsVersion } from "@/types/version.types";
import { sliceBits } from "@/utils/bit.utils";
import { BRANCH_RULES } from "./branch.rules";
import { buildInstructionDescriptions, getEncoding } from "@/utils/handler.utils";

const HANDLER = "BRANCH-HANDLER";

const REG_ZERO_BITS = '00000';

function isBranchMnemonic(mnemonic: string): boolean {
    return BRANCH_RULES.some(rule => rule.matchesMnemonic(mnemonic));
}

function isBranchEncoding(encoding: { mnemonic: string }): boolean {
    return isBranchMnemonic(encoding.mnemonic);
}

function findRuleByMnemonic(mnemonic: string) {
    return BRANCH_RULES.find(rule => rule.matchesMnemonic(mnemonic));
}

function findEncodingByOpcode(opcode: string) {
    return Object.values(ENCODING_BY_MNEMONIC).find(
        encoding =>
            encoding.opcode === opcode &&
            isBranchEncoding(encoding),
    );
}

/**
 * Resuelve el mnemónico correcto dado opcode + versión + campos rs/rt.
 * En R6, varios opcodes se comparten entre instrucciones; el campo rs y rt discrimina.
 */
function resolveBranchMnemonic( opcode: string, version: MipsVersion, rs: string, rt: string ): string {
    const rsNum = parseInt(rs, 2);
    const rtNum = parseInt(rt, 2);

    if (version === 'r6') {
        switch (opcode) {
            case '000110': return rtNum === 0 ? 'blez' : 'bgeuc';
            case '000111': return rtNum === 0 ? 'bgtz' : 'bltuc';

            case '001000': return rsNum >= rtNum ? 'bovc' : 'beqc';

            case '011000': return rsNum >= rtNum ? 'bnvc' : 'bnec';

            case '010111':
                if (rs === REG_ZERO_BITS) return 'bltzc';
                if (rs === rt)            return 'bgtzc';
                return 'bltc';

                case '010110':
                if (rs === REG_ZERO_BITS) return 'bgezc';
                if (rs === rt)            return 'blezc';
                return 'bgec';

            case '110110': return rs === REG_ZERO_BITS ? 'jic' : 'beqzc';

            case '111110': return rs === REG_ZERO_BITS ? 'jialc' : 'bnezc';
        }
    }

    const encoding = findEncodingByOpcode(opcode);
    if (!encoding)
        throw new HandlerError({ type: "UNKNOWN_OPCODE", message: `[${HANDLER}] opcode desconocido ${opcode}` });
    
    return encoding.mnemonic;
}

export const branchHandler = {
    instructions: buildInstructionDescriptions(isBranchEncoding),

    encode(instruction: DecodedInstruction, version: MipsVersion): string {
        const encoding = getEncoding(instruction.mnemonic, HANDLER, version);
        const rule = findRuleByMnemonic(instruction.mnemonic);

        if (!rule) {
            throw new HandlerError({
                type: "UNKNOWN_MNEMONIC",
                message: `[${HANDLER}] branch no soportado '${instruction.mnemonic}'`,
            });
        }

        return rule.encode(instruction, encoding);
    },

    decode(bits32: string, version: MipsVersion): DecodedInstruction {
        const { opcode, rs, rt } = sliceBits(bits32);

        const mnemonic = resolveBranchMnemonic(opcode, version, rs, rt);

        const encoding = ENCODING_BY_MNEMONIC[mnemonic];
        if (!encoding)
            throw new HandlerError({ type: "UNKNOWN_OPCODE", message: `[${HANDLER}] sin encoding para '${mnemonic}'` });

        const rule = findRuleByMnemonic(mnemonic);
        if (!rule?.decode)
            throw new HandlerError({ type: "UNKNOWN_MNEMONIC", message: `[${HANDLER}] decode no soportado para '${mnemonic}'` });

        return rule.decode(bits32, encoding);
    },

} satisfies InstructionHandler;
