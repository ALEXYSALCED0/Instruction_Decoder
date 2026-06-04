import type { DecodedInstruction, InstructionEncoding } from "@/types/instruction.types";
import type { MipsVersion } from "@/types/version.types";
import { legOneRegBranchRule } from "./rules/leg-one-reg-branch.rule";
import { legRegimmBranchRule } from "./rules/leg-regimm-branch.rule";
import { legTwoRegBranchRule } from "./rules/leg-two-regs-branch.rule";
import { r6CompactJump26Rule } from "./rules/r6-compact-jump-26.rule";
import { r6CompactOneRegBranchRule } from "./rules/r6-compact-one-reg-branch.rule";
import { r6IndexedJump16Rule } from "./rules/r6-indexed-jump-16.rule";
import { r6OneReg16BranchRule } from "./rules/r6-one-reg-16-branch.rule";
import { r6OneReg21BranchRule } from "./rules/r6-one-reg-21-branch.rule";
import { r6TwoRegBranchRule } from "./rules/r6-two-regs-branch.rule";

export type BranchEncodingRule = {
    name: string;

    matchesMnemonic(mnemonic: string): boolean;
    matchesEncoding?(encoding: InstructionEncoding): boolean;

    encode( instruction: DecodedInstruction, encoding: InstructionEncoding, version: MipsVersion): string;
    decode?( bits32: string, encoding: InstructionEncoding, version: MipsVersion): DecodedInstruction;
};

export const BRANCH_RULES = [
    legOneRegBranchRule,
    legRegimmBranchRule,
    legTwoRegBranchRule,
    r6CompactJump26Rule,
    r6CompactOneRegBranchRule,
    r6IndexedJump16Rule,
    r6OneReg16BranchRule,
    r6OneReg21BranchRule,
    r6TwoRegBranchRule,
]