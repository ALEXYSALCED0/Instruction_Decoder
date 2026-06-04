import type { DecodedInstruction } from "@/types/instruction.types";
import type { ImmediateOperand, RegisterOperand } from "@/types/operand.types";
import { REG_ZERO, type RegisterBits } from "@/constants/registers.constants";
import { bitsToSignedNum, constToBits, sliceBits } from "@/utils/bit.utils";
import { immediateToOperand, regToOperand } from "@/utils/operands.util";
import { regBitsToName, regNameToBits } from "@/utils/register.utils";
import type { BranchEncodingRule } from "../branch.rules";

// bltzc (rt < 0), bgezc (rt >= 0)
const MNEMONICS_RS_ZERO = new Set(["bltzc", "bgezc"]);
// bgtzc (rt > 0), blezc (rt <= 0)
const MNEMONICS_RS_EQ_RT = new Set(["bgtzc", "blezc"]);
const MNEMONICS = new Set([...MNEMONICS_RS_ZERO, ...MNEMONICS_RS_EQ_RT]);

export const r6CompactOneRegBranchRule = {
    name: "R6-COMPACT-ONE-REG-BRANCH",

    matchesMnemonic(mnemonic: string): boolean {
        return MNEMONICS.has(mnemonic);
    },

    encode(instruction, encoding): string {
        const [rtOp, offsetOp] = instruction.operands;

        const rt     = regNameToBits((rtOp as RegisterOperand).name);
        const offset = constToBits((offsetOp as ImmediateOperand).value, 16);
        const rs     = MNEMONICS_RS_ZERO.has(instruction.mnemonic) ? REG_ZERO : rt;

        return encoding.opcode + rs + rt + offset;
    },

    decode(bits32, encoding): DecodedInstruction {
        const { rt, imm16 } = sliceBits(bits32);

        return {
            mnemonic: encoding.mnemonic,
            operands: [
                regToOperand(regBitsToName(rt as RegisterBits)),
                immediateToOperand(bitsToSignedNum(imm16, 16)),
            ],
        };
    },
} satisfies BranchEncodingRule;
