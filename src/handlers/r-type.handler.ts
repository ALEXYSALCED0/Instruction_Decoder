/* 
    Responsabilidad: Encode y Decde de instruccones tipo R ( con OPCODE=0x0 )
        Se modularizó, removiendo el if/else para elegir la acción, se basa de los args del json
*/

import { ENCODING_BY_FUNCT } from "@/constants/instructions.constants";
import { OPCODES } from "@/constants/opcodes.constants";
import { REG_ZERO, RegisterBits } from "@/constants/registers.constants";
import { HandlerError, InstructionHandler } from "@/types/handler.types";
import { DecodedInstruction } from "@/types/instruction.types";
import { ImmediateOperand, Operand, RegisterOperand } from "@/types/operand.types";
import { MipsVersion } from "@/types/version.types";
import { constToBits, sliceBits } from "@/utils/bit.utils";
import { buildInstructionDescriptions, getEncoding } from "@/utils/handler.utils";
import { immediateToOperand, regToOperand } from "@/utils/operands.util";
import { regBitsToName, regNameToBits } from "@/utils/register.utils";


const HANDLER = "R-TYPE-HANDLER"

const isRTypeEncoding = (e: { opcode: string }) => e.opcode === OPCODES.SPECIAL;

export const rTypeHandler = {

    instructions: buildInstructionDescriptions(isRTypeEncoding),
    
    encode(instruction: DecodedInstruction, version:MipsVersion): string {
        const encoded = getEncoding(instruction.mnemonic, HANDLER, version);
        const { mnemonic, operands } = instruction;

        if ( ! encoded?.funct )
            throw new HandlerError({ type:'UNKNOWN_MNEMONIC', message:`[R-type-handler] Encoding no encontrado para ${mnemonic}`})

        let rs    : RegisterBits = REG_ZERO;
        let rt    : RegisterBits = REG_ZERO;
        let rd    : RegisterBits = REG_ZERO;
        let shamt = (encoded.shamt ?? REG_ZERO);

        encoded.args.forEach((arg, i) => {
            const op = operands[i];
            if ( ! op ) return;

            if ( arg === 'rd' )     rd    = regNameToBits((op as RegisterOperand).name);
            if ( arg === 'rs' )     rs    = regNameToBits((op as RegisterOperand).name);
            if ( arg === 'rt' )     rt    = regNameToBits((op as RegisterOperand).name);
            if ( arg === 'shamt' )  shamt = constToBits((op as ImmediateOperand).value, 5);
            if ( arg === 'sa'    )  shamt = constToBits((op as ImmediateOperand).value - 1, 2) + '000';

            // De las trap functions del legacy
            if (arg === 'code' && op.kind === 'immediate') {
                const code = constToBits(op.value, 10);
                rd    = code.slice(0, 5) as RegisterBits;
                shamt = code.slice(5);
            }
        });

        return OPCODES.SPECIAL + rs + rt + rd + shamt + encoded.funct;
    },
    
    decode(bits32: string, version: MipsVersion): DecodedInstruction {
        const { rs, rt, rd, shamt, funct } = sliceBits(bits32);

        const tryFunct = (v: MipsVersion) =>
            ENCODING_BY_FUNCT[`${funct}:${shamt}:${v}`] ??
            ENCODING_BY_FUNCT[`${funct}:*:${v}`];

        const encoded =
            tryFunct(version) ??
            tryFunct('mips1') ??
            tryFunct('mips2') ??
            tryFunct('legacy') ??
            tryFunct('r6');

        if ( ! encoded )
            throw new HandlerError({ type:'UNKNOWN_FUNCT', message:`[R-type-handler] funct desconocido ${funct} shamt ${shamt}`})

        const operands : Operand[] = encoded.args.map((arg) : Operand => {
            switch (arg) {
                case 'rd':    return regToOperand(regBitsToName(rd    as RegisterBits));
                case 'rs':    return regToOperand(regBitsToName(rs    as RegisterBits));
                case 'rt':    return regToOperand(regBitsToName(rt    as RegisterBits));
                case 'shamt': return immediateToOperand(parseInt(shamt, 2));
                case 'sa':    return immediateToOperand(parseInt(shamt.slice(0, 2), 2) + 1);
                case 'code':  return immediateToOperand(parseInt(rd + shamt, 2));
                default:      return immediateToOperand(0);
            }
        });

        return { mnemonic: encoded.mnemonic, operands };
    },

} satisfies InstructionHandler
