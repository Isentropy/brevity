/* 
     args:
     returnMemAddressOffset: uint128, returnMemAddressLen: uint128 (packed as 1 uint256)
     toAddress,
     [value : Quantity if OPCODE_CALL, omitted if OPCODE_STATICCALL, OPCODE_DELEGATECALL)],
     fnSelector,
     ...calldataArgs (interpreted as Quantity)
    */
uint8 constant OPCODE_STATICCALL = 0;
uint8 constant OPCODE_CALL = 1;
uint8 constant OPCODE_DELEGATECALL = 2;
// set pc = branch if q != 0
// args: q (Quantity), branch
uint8 constant OPCODE_CMP_BRANCH = 3;
// set pc = branch
// args: branch
uint8 constant OPCODE_JUMP = 4;

// args: (offset : u128 , len :u128), topic {0, 4}
//uint8 constant OPCODE_LOG = 10;
// console.log all of mem for debugging. no args
uint8 constant OPCODE_DUMPMEM = 11;
// opcodes above 128 refer to memAddress := opcode - 128
// write q to mem[memAddress]
// args: q (Quantity)
uint8 constant OPCODE_MSTORE_R0 = 128;

/*
    if(qWord < BIT255) interpret as literal
    else qWord ^= BIT255 //unset bit 255
    
    if (qWord < BIT254), interpret as mem[qWord]
    else qWord ^= BIT254 //unset bit 254
    
    interpret as  _resolve(Quantities[qWord]) // evm builtin readonly fn calls
    
    // this allows mem and most literals to be encoded in 1 word
    */
// BIT255 on means NOT literal
uint256 constant BIT255_NOTLITERAL = 1 << 255;
// BIT254 on means NOT memory address
uint256 constant BIT254_NOTMEM = 1 << 254;
uint8 constant QUANTITY_LITERAL = 0;
uint8 constant QUANTITY_OP_ADD = 1;
uint8 constant QUANTITY_OP_MUL = 2;
uint8 constant QUANTITY_OP_SUB = 3;
uint8 constant QUANTITY_OP_DIV = 4;
uint8 constant QUANTITY_OP_MOD = 6;
uint8 constant QUANTITY_OP_LT = 0x10;
uint8 constant QUANTITY_OP_GT = 0x11;
uint8 constant QUANTITY_OP_EQ = 0x12;
//uint8 constant public QUANTITY_OP_ISZERO = 0x13;
uint8 constant QUANTITY_OP_AND = 0x16;
uint8 constant QUANTITY_OP_OR = 0x17;
uint8 constant QUANTITY_OP_XOR = 0x18;
uint8 constant QUANTITY_OP_NOT = 0x19;
uint8 constant QUANTITY_OP_SHL = 0x1B;
uint8 constant QUANTITY_OP_SHR = 0x1C;

uint8 constant QUANTITY_ADDRESS_THIS = 0x30;
uint8 constant QUANTITY_BALANCE = 0x31;
uint8 constant QUANTITY_CALLER = 0x33;
uint8 constant QUANTITY_CALLVALUE = 0x34;
uint8 constant QUANTITY_BLOCKTIMESTAMP = 0x42;

// config flags
// this tells interpreterer to run the whole script in Uniswap4 unlock() as a callback
uint128 constant CONFIGFLAG_UNISWAP4UNLOCK = 1;



//EIP712 metaTx functions
bytes32 constant _PROGRAM_TYPEHASH = keccak256(
    "Program(uint256 config,Instruction[] instructions,Quantity[] quantities,uint256 nonce,uint256 deadline)Instruction(uint256 opcode,bytes32[] args)Quantity(uint256 quantityType,bytes32[] args)"
);
bytes32 constant _INSTRUCTION_TYPEHASH = keccak256(
    "Instruction(uint256 opcode,bytes32[] args)"
);
bytes32 constant _QUANTITY_TYPEHASH = keccak256(
    "Quantity(uint256 quantityType,bytes32[] args)"
);

uint256 constant JUMPDEST_RETURN = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
uint256 constant JUMPDEST_REVERT = 0x0FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;

uint256 constant MAXUINT256 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
uint256 constant LOW128BITSMASK = 0x00000000000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
uint256 constant LOW64BITSMASK = 0x000000000000000000000000000000000000000000000000FFFFFFFFFFFFFFFF;

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
error UnsupportedConfigFlags(uint128 flags);
error WrongBrevityVersion(uint expected, uint found);
error NotPermitted(uint pc, uint opcode);
error Reverted(uint pc);
error CallFailed(uint pc);
error BadJump(uint pc, uint jumpDest);
