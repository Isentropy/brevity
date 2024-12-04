pragma solidity ^0.8.27;
pragma abicoder v2;
import "hardhat/console.sol";
import "./IBrevityInterpreter.sol";
abstract contract BrevityInterpreter is IBrevityInterpreter {

    //EIP712 metaTx functions
    bytes32 internal constant _PROGRAM_TYPEHASH =
        keccak256(
            "Program(uint256 config,Instruction[] instructions,Quantity[] quantities,uint256 nonce,uint256 deadline)Instruction(uint256 opcode,bytes32[] args)Quantity(uint256 quantityType,bytes32[] args)"
        );
    bytes32 internal constant _INSTRUCTION_TYPEHASH =
        keccak256("Instruction(uint256 opcode,bytes32[] args)");
    bytes32 internal constant _QUANTITY_TYPEHASH =
        keccak256("Quantity(uint256 quantityType,bytes32[] args)");

    function _encodeInstructionsArray(
        Instruction[] calldata instructions
    ) internal pure returns (bytes32) {
        bytes32[] memory slots = new bytes32[](instructions.length);
        for (uint i = 0; i < instructions.length; i++) {
            slots[i] = keccak256(
                abi.encode(
                    _INSTRUCTION_TYPEHASH,
                    instructions[i].opcode,
                    keccak256(abi.encodePacked(instructions[i].args))
                )
            );
        }
        // no length
        return keccak256(abi.encodePacked(slots));
    }

    function _encodeQuantityArray(
        Quantity[] calldata quantities
    ) internal pure returns (bytes32) {
        bytes32[] memory slots = new bytes32[](quantities.length);
        for (uint i = 0; i < quantities.length; i++) {
            slots[i] = keccak256(
                abi.encode(
                    _QUANTITY_TYPEHASH,
                    quantities[i].quantityType,
                    keccak256(abi.encodePacked(quantities[i].args))
                )
            );
        }
        // no length
        return keccak256(abi.encodePacked(slots));
    }

    error WrongBrevityVersion(uint expected, uint found);
    error NotPermitted(uint pc, uint opcode);
    error Reverted(uint pc);
    error CallFailed(uint pc);
    error BadJump(uint pc, uint jumpDest);


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
    uint8 constant OPCODE_LOG = 10;
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

    uint256 constant JUMPDEST_RETURN =
        0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
    uint256 constant JUMPDEST_REVERT =
        0x0FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;

    uint256 constant MAXUINT256 =
        0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
    uint256 constant LOW128BITSMASK =
        0x00000000000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
    uint256 constant LOW64BITSMASK =
        0x000000000000000000000000000000000000000000000000FFFFFFFFFFFFFFFF;
    
    // DELEGATECALL disabled by default
    //uint256 constant CONFIGFLAG_NO_DELEGATECALL =
    //    0x0000000000000000000000000000000100000000000000000000000000000000;

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

    function _resolve(
        uint qWord,
        uint[] memory mem,
        Quantity[] calldata quantities
    ) internal view returns (uint) {
        //console.log('qIndex', qIndex);
        if (qWord & BIT255_NOTLITERAL == 0) {
            return qWord;
        }
        if (qWord & BIT254_NOTMEM == 0) {
            return mem[qWord ^ BIT255_NOTLITERAL];
        }
        // unset bits 255 and 254
        qWord ^= (BIT255_NOTLITERAL | BIT254_NOTMEM);

        Quantity calldata q = quantities[qWord];
        uint quantityType = q.quantityType;
        // dont need quantities[] to resolve:
        if (quantityType == QUANTITY_LITERAL) return uint(q.args[0]);
        // 0 arg OPs
        if (quantityType == QUANTITY_ADDRESS_THIS)
            return uint(uint160(address(this)));
        if (quantityType == QUANTITY_CALLER)
            return uint(uint160(address(msg.sender)));
        if (quantityType == QUANTITY_BLOCKTIMESTAMP) return block.timestamp;
        if (quantityType == QUANTITY_CALLVALUE) return msg.value;

        // 1 arg OPs
        uint r1 = _resolve(uint(q.args[0]), mem, quantities);
        //console.log('r1', r1);

        if (quantityType == QUANTITY_BALANCE)
            return address(uint160(r1)).balance;
        if (quantityType == QUANTITY_OP_NOT) {
            return ~r1;
        }
        // 2 arg OPs
        uint r2 = _resolve(uint(q.args[1]), mem, quantities);
        if (quantityType == QUANTITY_OP_ADD) return r1 + r2;
        if (quantityType == QUANTITY_OP_MUL) return r1 * r2;
        if (quantityType == QUANTITY_OP_SUB) return r1 - r2;
        if (quantityType == QUANTITY_OP_DIV) return r1 / r2;
        if (quantityType == QUANTITY_OP_MOD) return r1 % r2;
        if (quantityType == QUANTITY_OP_LT) return r1 < r2 ? MAXUINT256 : 0;
        if (quantityType == QUANTITY_OP_GT) return r1 > r2 ? MAXUINT256 : 0;
        if (quantityType == QUANTITY_OP_EQ) return r1 == r2 ? MAXUINT256 : 0;
        if (quantityType == QUANTITY_OP_AND) return r1 & r2;
        if (quantityType == QUANTITY_OP_OR) return r1 | r2;
        if (quantityType == QUANTITY_OP_XOR) return r1 ^ r2;
        if (quantityType == QUANTITY_OP_SHL) return r1 << r2;
        if (quantityType == QUANTITY_OP_SHR) return r1 >> r2;
        revert("unknown quantityType");
    }


    function _checkBrevityVersion(uint foundVersion) internal view {
        if(foundVersion == 0) return;
        uint version = IBrevityInterpreter(address(this)).version();
        if(foundVersion != version) revert WrongBrevityVersion(version, foundVersion);
    }

    function _onCall(address to, uint value, uint[] memory resolvedArgs) internal virtual {}

    /*
    config is: uint128 flags, uint64 requiredBrevityVersion (or 0 for none), uint64 memSize 
    */

    function _run(
        uint config,
        Instruction[] calldata instructions,
        Quantity[] calldata quantities
    ) internal {
        uint pc = 0;
        //uint steps = 0;
        //uint gasBeforeStart = gasleft();
        _checkBrevityVersion((config >> 64) & LOW64BITSMASK);
        uint[] memory mem = new uint[](config & LOW64BITSMASK);
        //console.log('allocate registers gas', gasBeforeStart - gasleft());
        while (pc < instructions.length) {
            // console.log("step", steps);
            //uint gasBefore = gasleft();
            //steps++;
            uint opcode = instructions[pc].opcode;
            bytes32[] calldata args = instructions[pc].args;
            if (opcode < 3) {
                uint[] memory resolvedArgs;

                // tmp is reused a few times to conserve stack size
                // tmp here means index of last arg before calldata quantities
                // CALL has an additional value arg
                uint tmp = opcode == OPCODE_CALL ? 3 : 2;
                resolvedArgs = new uint[](args.length - tmp);
                // function selector. put in mem in first slot
                if (resolvedArgs.length > 0) {
                    resolvedArgs[0] = uint(args[tmp]);
                    for (uint i = tmp + 1; i < args.length; i++) {
                        resolvedArgs[i - tmp] = _resolve(
                            uint(args[i]),
                            mem,
                            quantities
                        );
                    }
                }
                //printMem(resolvedArgs);
                uint offset = uint(args[0]) >> 128;
                uint len = uint(args[0]) & LOW128BITSMASK;
                if(offset + len > mem.length) revert NotPermitted(pc, opcode);
                // call, staticcall, delegatecall
                // let callArgs = [registerWriteInfo, toBytes32(address), GAS]
                address to = address(
                    uint160(_resolve(uint(args[1]), mem, quantities))
                );

                // tmp will be assigned to success after call
                // result, if desired, written directly to mem
                if (opcode == OPCODE_STATICCALL) {
                    assembly {
                        // start from args[4] - 8 bytes for selector
                        // gas, address, argsOffset, argsSize, retOffset, retSize
                        tmp := staticcall(
                            sub(gas(), 10000),
                            to,
                            add(resolvedArgs, 60),
                            add(4, mul(sub(mload(resolvedArgs), 1), 32)),
                            add(add(mem, 32), mul(offset, 32)),
                            mul(len, 32)
                        )
                    }
                } else if (opcode == OPCODE_CALL) {
                    // tmp is reused here as VALUE to limit stack overgrowth
                    tmp = _resolve(uint(args[2]), mem, quantities);
                    //if no function selector, it's just eth end wo data
                    _onCall(to, tmp, resolvedArgs);
                    if (resolvedArgs.length == 0) {
                        assembly {
                            tmp := call(sub(gas(), 10000), to, tmp, 0, 0, 0, 0)
                        }
                    } else {
                        assembly {
                            // start from args[4] - 8 bytes for selector
                            // gas, address, value, argsOffset, argsSize, retOffset, retSize
                            tmp := call(
                                sub(gas(), 10000),
                                to,
                                tmp,
                                add(resolvedArgs, 60),
                                add(4, mul(sub(mload(resolvedArgs), 1), 32)),
                                add(add(mem, 32), mul(offset, 32)),
                                mul(len, 32)
                            )
                        }
                    }
                } else if (opcode == OPCODE_DELEGATECALL) {
                    revert NotPermitted(pc, opcode);
                    /*
                    // DELEGATECALL disabled until there's a good use case. 
                    // Brevity script shouldn't directly manipulate this' storage

                    assembly {
                        // start from args[4] - 8 bytes for selector
                        // gas, address, argsOffset, argsSize, retOffset, retSize
                        tmp := delegatecall(
                            sub(gas(), 10000),
                            to,
                            add(resolvedArgs, 60),
                            add(4, mul(sub(mload(resolvedArgs), 1), 32)),
                            add(add(mem, 32), mul(offset, 32)),
                            mul(len, 32)
                        )
                    }
                    */
                }
                if (tmp == 0) revert CallFailed(pc);
                //delete resolvedArgs;
                //console.log("success", callArgsEnd);
            } else if (opcode == OPCODE_JUMP) {
                // args: dest
                uint dest = uint(args[0]);
                if (dest <= instructions.length) {
                    pc = dest;
                    continue;
                }
                if (dest == JUMPDEST_RETURN) return;
                if (dest == JUMPDEST_REVERT) revert Reverted(pc);
                revert BadJump(pc, dest);
            } else if (opcode == OPCODE_CMP_BRANCH) {
                // args: quantityNum : qWord, to: uint
                uint val = _resolve(uint(args[0]), mem, quantities);
                //console.log('branch v = ', v);
                if (val != 0) {
                    //console.log("op", opcode, "gasUsed", gasBefore - gasleft());
                    uint dest = uint(args[1]);
                    if (dest <= instructions.length) {
                        pc = dest;
                        continue;
                    }
                    if (dest == JUMPDEST_RETURN) return;
                    if (dest == JUMPDEST_REVERT) revert Reverted(pc);
                    revert BadJump(pc, dest);
                }
            } else if (opcode >= OPCODE_MSTORE_R0) {
                // write to a register
                // args: quantityNum : *Quantity
                mem[opcode - OPCODE_MSTORE_R0] = _resolve(
                    uint(args[0]),
                    mem,
                    quantities
                );
            } else if (opcode == OPCODE_DUMPMEM) {
                printMem(mem, 0, mem.length);
            } else {
                revert NotPermitted(pc, opcode);
            }
            //console.log("op", opcode, "gasUsed", gasBefore - gasleft());
            pc++;
        }
    }

    function printMem(uint[] memory mem, uint from, uint to) public pure {
        console.log("Mem Dump:");
        for (uint i = from; i < to; i++) {
            console.log(i, " = ", mem[i]);
        }
    }
}
