import { REG_ZERO, RegisterBits } from "@/constants/registers.constants";
import { I_TYPE_MNEMONICS } from "@/constants/set.constants";
import { InstructionHandler } from "@/types/handler.types";
import { DecodedInstruction } from "@/types/instruction.types";
import { ImmediateOperand, RegisterOperand } from "@/types/operand.types";
import { MipsVersion } from "@/types/version.types";
import { bitsToSignedNum, constToBits, sliceBits } from "@/utils/bit.utils";
import { buildInstructionDescriptions, findEncodingByOpcode, getEncoding } from "@/utils/handler.utils";
import { regBitsToName, regNameToBits } from "@/utils/register.utils";

const HANDLER = "I-TYPE-HANDLER"

const isITypeEncoding = (e: { mnemonic: string }) => I_TYPE_MNEMONICS.includes(e.mnemonic);

export const iTypeHandler = {

    instructions: buildInstructionDescriptions(isITypeEncoding),

    encode(instruction: DecodedInstruction, version: MipsVersion): string {
        const encoded = getEncoding(instruction.mnemonic, HANDLER, version);
        const { mnemonic, operands } = instruction;

        if (mnemonic === 'lui') {
            const rt = regNameToBits((operands[0] as RegisterOperand).name);
            const immediate = constToBits((operands[1] as ImmediateOperand).value, 16);
            return encoded.opcode + REG_ZERO + rt + immediate;
        }

        const rt = regNameToBits((operands[0] as RegisterOperand).name);
        const rs = regNameToBits((operands[1] as RegisterOperand).name);
        const imm = constToBits((operands[2] as ImmediateOperand).value, 16);
        return encoded.opcode + rs + rt + imm;
    },

    decode(bits32: string, version: MipsVersion): DecodedInstruction {
        const { opcode, rs, rt, imm16 } = sliceBits(bits32);

        // Buscar encoding respetando la versión
        const encoded = findEncodingByOpcode(opcode, isITypeEncoding, HANDLER, version);

        // lui (rs=0) y aui (rs!=0) comparten opcode 001111 en R6
        const isLuiAuiOpcode = encoded.mnemonic === 'lui' || encoded.mnemonic === 'aui';
        const mnemonic = isLuiAuiOpcode
            ? (rs === REG_ZERO ? 'lui' : 'aui')
            : encoded.mnemonic;

        if (mnemonic === 'aui')
            return {
                mnemonic: 'aui',
                operands: [
                    { kind: 'register', name: regBitsToName(rt as RegisterBits) },
                    { kind: 'register', name: regBitsToName(rs as RegisterBits) },
                    { kind: 'immediate', value: parseInt(imm16, 2) },
                ],
            };

        if (mnemonic === 'lui')
            return {
                mnemonic: 'lui',
                operands: [
                    { kind: 'register', name: regBitsToName(rt as RegisterBits) },
                    { kind: 'immediate', value: parseInt(imm16, 2) },
                ],
            };

        return {
            mnemonic,
            operands: [
                { kind: 'register', name: regBitsToName(rt as RegisterBits) },
                { kind: 'register', name: regBitsToName(rs as RegisterBits) },
                { kind: 'immediate', value: bitsToSignedNum(imm16, 16) },
            ],
        };
    },

} satisfies InstructionHandler
