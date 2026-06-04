import { RegisterBits, RegisterName } from "@/constants/registers.constants";
import { MEMORY_MNEMONICS } from "@/constants/set.constants";
import { InstructionHandler } from "@/types/handler.types";
import { DecodedInstruction } from "@/types/instruction.types";
import { MemoryOperand, RegisterOperand } from "@/types/operand.types";
import { MipsVersion } from "@/types/version.types";
import { bitsToSignedNum, constToBits, sliceBits } from "@/utils/bit.utils";
import { buildInstructionDescriptions, findEncodingByOpcode, getEncoding } from "@/utils/handler.utils";
import { regBitsToName, regNameToBits } from "@/utils/register.utils";

const HANDLER = "MEMORY-HANDLER"

const isMemoryEncoding = (e: { mnemonic: string }) => MEMORY_MNEMONICS.includes(e.mnemonic);

export const memoryHandler = {

    instructions: buildInstructionDescriptions(isMemoryEncoding),
    
    encode(instruction: DecodedInstruction, version:MipsVersion): string {
        const encoded = getEncoding(instruction.mnemonic, HANDLER, version);

        // rt, offset(base) es opcode | rs(base) | rt | offset16
        const rt        = regNameToBits((instruction.operands[0] as RegisterOperand).name);
        const mem       = instruction.operands[1] as MemoryOperand;
        const rs        = regNameToBits(mem.base as RegisterName);
        const offset    = constToBits(mem.offset, 16);

        return encoded.opcode + rs + rt + offset;
    },
    
    decode(bits32: string, version: MipsVersion): DecodedInstruction {
        const { opcode, rs, rt, imm16 } = sliceBits(bits32);

        const encoded = findEncodingByOpcode(opcode, isMemoryEncoding, HANDLER);

        return {
            mnemonic: encoded.mnemonic,
            operands: [
                { kind: 'register', name: regBitsToName(rt as RegisterBits) },
                { kind: 'memory',   base: regBitsToName(rs as RegisterBits), offset: bitsToSignedNum(imm16, 16) },
            ],
        };
    },

} satisfies InstructionHandler
