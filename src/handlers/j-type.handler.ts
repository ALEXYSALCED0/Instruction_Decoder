import { J_TYPE_MNEMONICS } from "@/constants/set.constants";
import { InstructionHandler } from "@/types/handler.types";
import { DecodedInstruction } from "@/types/instruction.types";
import { ImmediateOperand } from "@/types/operand.types";
import { MipsVersion } from "@/types/version.types";
import { constToBits, sliceBits } from "@/utils/bit.utils";
import { buildInstructionDescriptions, findEncodingByOpcode, getEncoding } from "@/utils/handler.utils";

const HANDLER = "JUMP-HANDLER"
const isJTypeEncoding = (e: { mnemonic: string }) => J_TYPE_MNEMONICS.includes(e.mnemonic);


export const jTypeHandler = {

    instructions: buildInstructionDescriptions(isJTypeEncoding),

    encode(instruction: DecodedInstruction, version:MipsVersion ): string {
        const encoded = getEncoding(instruction.mnemonic, HANDLER, version);

        const address = constToBits((instruction.operands[0] as ImmediateOperand).value, 26);
        return encoded.opcode + address;
    },

    decode(bits32: string, version: MipsVersion): DecodedInstruction {
        const { opcode, imm26 } = sliceBits(bits32);

        const encoded = findEncodingByOpcode(opcode, isJTypeEncoding, HANDLER);

        return {
            mnemonic: encoded.mnemonic,
            operands: [{ kind: 'immediate', value: parseInt(imm26, 2) }],
        };
    },

} satisfies InstructionHandler
