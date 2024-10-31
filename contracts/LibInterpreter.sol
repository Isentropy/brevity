pragma solidity ^0.8.27;
import "hardhat/console.sol";
library Interpreter {
    /* 
     args:
     returnMemAddressOffset: uint128, returnMemAddressLen: uint128
     toAddress,
     gasLimit,
     fnSelector,
     [value if OPCODE_CALL, omitted if OPCODE_STATICCALL, OPCODE_DELEGATECALL)]
     ...calldataArgs (interpreted as Quantity)
    */
    uint8 public constant OPCODE_STATICCALL = 0;
    uint8 public constant OPCODE_CALL = 1;
    uint8 public constant OPCODE_DELEGATECALL = 2;
    // set pc = branch if q != 0
    // args: q (Quantity), branch
    uint8 public constant OPCODE_CMP_BRANCH = 3;
    // set pc = branch
    // args: branch
    uint8 public constant OPCODE_JUMP = 4;
    // opcodes above 128 refer to memAddress := opcode - 128
    // write q to mem[memAddress]
    // args: q (Quantity)
    uint8 public constant OPCODE_MSTORE_R0 = 128;

    /*
    if(qWord < BIT255) interpret as literal
    else qWord ^= BIT255 //unset bit 255
    
    if (qWord < BIT254), interpret as mem[qWord]
    else qWord ^= BIT254 //unset bit 254
    
    interpret as  _resolve(Quantities[qWord]) // evm builtin readonly fn calls
    
    // this allows mem and most literals to be encoded in 1 word
    */
    // BIT255 on means NOT literal
    uint256 public constant BIT255_NOTLITERAL = 1 << 255;
    // BIT254 on means NOT memory address
    uint256 public constant BIT254_NOTMEM = 1 << 254;
    uint8 public constant QUANTITY_LITERAL = 0;
    uint8 public constant QUANTITY_OP_ADD = 1;
    uint8 public constant QUANTITY_OP_MUL = 2;
    uint8 public constant QUANTITY_OP_SUB = 3;
    uint8 public constant QUANTITY_OP_DIV = 4;
    uint8 public constant QUANTITY_OP_MOD = 6;
    uint8 public constant QUANTITY_OP_LT = 0x10;
    uint8 public constant QUANTITY_OP_GT = 0x11;
    uint8 public constant QUANTITY_OP_EQ = 0x12;
    //uint8 constant public QUANTITY_OP_ISZERO = 0x13;

    uint8 public constant QUANTITY_OP_AND = 0x16;
    uint8 public constant QUANTITY_OP_OR = 0x17;
    uint8 public constant QUANTITY_OP_XOR = 0x18;
    uint8 public constant QUANTITY_OP_NOT = 0x19;
    uint8 public constant QUANTITY_OP_SHL = 0x1B;
    uint8 public constant QUANTITY_OP_SHR = 0x1C;
    uint8 public constant QUANTITY_ADDRESS_THIS = 0x30;
    uint8 public constant QUANTITY_BALANCE = 0x31;

    struct Instruction {
        uint opcode;
        bytes32[] args;
    }

    struct Quantity {
        uint quantityType;
        bytes32[] args;
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
        // 1 arg OPs
        uint r1 = _resolve(uint(q.args[0]), mem, quantities);
        if (quantityType == QUANTITY_BALANCE)
            return address(uint160(r1)).balance;
        // 2 arg OPs
        uint r2 = _resolve(uint(q.args[1]), mem, quantities);
        if (quantityType == QUANTITY_OP_ADD) return r1 + r2;
        if (quantityType == QUANTITY_OP_MUL) return r1 * r2;
        if (quantityType == QUANTITY_OP_SUB) return r1 - r2;
        if (quantityType == QUANTITY_OP_DIV) return r1 / r2;
        if (quantityType == QUANTITY_OP_MOD) return r1 % r2;
        if (quantityType == QUANTITY_OP_LT) return r1 < r2 ? 1 : 0;
        if (quantityType == QUANTITY_OP_GT) return r1 > r2 ? 1 : 0;
        if (quantityType == QUANTITY_OP_EQ) return r1 == r2 ? 1 : 0;
        if (quantityType == QUANTITY_OP_AND) return r1 & r2;
        if (quantityType == QUANTITY_OP_OR) return r1 | r2;
        if (quantityType == QUANTITY_OP_XOR) return r1 ^ r2;
        if (quantityType == QUANTITY_OP_SHL) return r1 << r2;
        if (quantityType == QUANTITY_OP_SHR) return r1 >> r2;
        revert("unknown quantityType");
    }

    function _run(
        uint256 memSize,
        Instruction[] calldata program,
        Quantity[] calldata quantities
    ) internal {
        uint pc = 0;
        //uint steps = 0;
        //uint gasBeforeStart = gasleft();
        uint[] memory mem = new uint[](memSize);
        //console.log('allocate registers gas', gasBeforeStart - gasleft());
        while (pc < program.length) {
            // console.log("step", steps);
            //uint gasBefore = gasleft();
            //steps++;
            uint opcode = program[pc].opcode;
            bytes32[] calldata args = program[pc].args;
            if (opcode < 3) {
                uint[] memory resolvedArgs;

                // tmp is reused a few times to conserve stack size
                // tmp here means index of last arg before calldata quantities
                // CALL has an additional value arg
                uint tmp = opcode == OPCODE_CALL ? 4 : 3;
                resolvedArgs = new uint[](args.length - tmp);
                // function selector. put in mem in first slot
                resolvedArgs[0] = uint(args[3]);
                for (uint i = tmp + 1; i < args.length; i++) {
                    resolvedArgs[i - tmp] = _resolve(
                        uint(args[i]),
                        mem,
                        quantities
                    );
                }
                uint offset = uint(args[0]) >> 128;
                uint len = (uint(args[0]) << 128) >> 128;
                require(offset + len <= memSize, "bad write dest");
                // call, staticcall, delegatecall
                // let callArgs = [registerWriteInfo, toBytes32(address), GAS]
                address to = address(
                    uint160(_resolve(uint(args[1]), mem, quantities))
                );
                uint gasLimit = uint(args[2]);


                // tmp will be assigned to success after call
                // result, if desired, written directly to mem
                if (opcode == OPCODE_STATICCALL) {
                    assembly {
                        // start from args[4] - 8 bytes for selector
                        // gas, address, argsOffset, argsSize, retOffset, retSize
                        tmp := staticcall(
                            gasLimit,
                            to,
                            add(resolvedArgs, 60),
                            add(4, mul(sub(mload(resolvedArgs), 1), 32)),
                            add(add(mem, 32), mul(offset, 32)),
                            mul(len, 32)
                        )
                    }
                } else if (opcode == OPCODE_CALL) {
                    // tmp is reused here as VALUE to limit stack overgrowth
                    tmp = _resolve(uint(args[4]), mem, quantities);
                    //console.log("value", len);
                    assembly {
                        // start from args[4] - 8 bytes for selector
                        // gas, address, value, argsOffset, argsSize, retOffset, retSize
                        tmp := call(
                            gasLimit,
                            to,
                            tmp,
                            add(resolvedArgs, 60),
                            add(4, mul(sub(mload(resolvedArgs), 1), 32)),
                            add(add(mem, 32), mul(offset, 32)),
                            mul(len, 32)
                        )
                    }
                } else if (opcode == OPCODE_DELEGATECALL) {
                    assembly {
                        // start from args[4] - 8 bytes for selector
                        // gas, address, argsOffset, argsSize, retOffset, retSize
                        tmp := delegatecall(
                            gasLimit,
                            to,
                            add(resolvedArgs, 60),
                            add(4, mul(sub(mload(resolvedArgs), 1), 32)),
                            add(add(mem, 32), mul(offset, 32)),
                            mul(len, 32)
                        )
                    }
                }
                if(tmp == 0) revert("badCall");
                //delete resolvedArgs;
                //console.log("success", callArgsEnd);
            } else if (opcode == OPCODE_JUMP) {
                // args: dest
                uint dest = uint(args[0]);
                if(dest > program.length) revert("badJump");
                //console.log("op", opcode, "gasUsed", gasBefore - gasleft());
                pc = dest;
                continue;
            } else if (opcode == OPCODE_CMP_BRANCH) {
                // args: quantityNum : qWord, to: uint
                uint val = _resolve(uint(args[0]), mem, quantities);
                //console.log('branch v = ', v);
                if (val != 0) {
                    //console.log("op", opcode, "gasUsed", gasBefore - gasleft());
                    uint dest = uint(args[1]);
                    if(dest > program.length) revert("badJump");
                    pc = dest;
                    continue;
                }
            } else if (opcode >= OPCODE_MSTORE_R0) {
                // write to a register
                // args: quantityNum : *Quantity
                mem[opcode - OPCODE_MSTORE_R0] = _resolve(uint(args[0]), mem, quantities);
            } else {
                revert("unknown opcode");
            }
            //console.log("op", opcode, "gasUsed", gasBefore - gasleft());
            pc++;
        }
        //printMem(mem);
    }

    function printMem(uint[] memory mem) public pure {
        console.log("Mem Dump:");
        for (uint i = 0; i < mem.length; i++) {
            console.log(i, " = ", mem[i]);
        }
    }
}
