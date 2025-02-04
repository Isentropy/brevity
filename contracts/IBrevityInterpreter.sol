pragma solidity ^0.8.27;
pragma abicoder v2;

struct Instruction {
    uint opcode;
    bytes32[] args;
}

struct Quantity {
    uint quantityType;
    bytes32[] args;
}

struct Program {
    // high 128 bits are flags, low 128 bits are memory size
    uint config;
    Instruction[] instructions;
    Quantity[] quantities;
}

error WrongBrevityVersion(uint expected, uint found);
error NotPermitted(uint pc, uint opcode);
error Reverted(uint pc);
error CallFailed(uint pc);
error BadJump(uint pc, uint jumpDest);

interface IBrevityInterpreter {
    function version() external pure returns (uint);
    function run(Program calldata p) external payable;
    function runMeta(
        Program calldata p,
        uint deadline,
        bytes calldata sig
    ) external payable;
}
