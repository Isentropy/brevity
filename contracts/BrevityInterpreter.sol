pragma solidity ^0.8.27;
pragma abicoder v2;
import "./IBrevityInterpreter.sol";
import "./Constants.sol";
import "@openzeppelin/contracts/utils/Nonces.sol";
import "./IDebugTools.sol";

abstract contract BrevityInterpreter is IBrevityInterpreter, Nonces {

    function version() public pure returns (uint) {
        return 1;
    }
    function emitKeyValue(uint key, uint val) public {
        // must call from within Brevity
        require(msg.sender == address(this));
        emit IBrevityInterpreter.KeyValue(key, val);
    }
    function nonces(address signer) public virtual override(IBrevityInterpreter, Nonces) view returns (uint256) {
        return super.nonces(signer);
    }
    // a hash of the compiled program. not used by EIP712
    function _programHash(Program calldata p) internal pure returns (bytes32) {
        return keccak256(abi.encode(p.config, _encodeInstructionsArray(p.instructions), _encodeQuantityArray(p.quantities)));
    }
    
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

    function _resolve(
        uint qWord,
        uint[] memory mem,
        Quantity[] calldata quantities
    ) internal view returns (uint) {
        // check metadata bits 255-128
        if (qWord & BIT255_NOTLITERAL == 0) {
            return qWord;
        }
        if (qWord & BIT254_NOTMEM == 0) {
            return mem[qWord ^ BIT255_NOTLITERAL];
        }
        // 
        Quantity calldata q = quantities[qWord & LOW128BITSMASK];
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
        if(qWord & BIT128_UNCHECKED_ARITHMATIC != 0) {
            unchecked {
                if (quantityType == QUANTITY_OP_ADD) return r1 + r2;
                if (quantityType == QUANTITY_OP_MUL) return r1 * r2;
                if (quantityType == QUANTITY_OP_SUB) return r1 - r2;                
            }
        } else {
            if (quantityType == QUANTITY_OP_ADD) return r1 + r2;
            if (quantityType == QUANTITY_OP_MUL) return r1 * r2;
            if (quantityType == QUANTITY_OP_SUB) return r1 - r2;                            
        }

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


    function _validateConfig(uint256 config) internal view {
        uint64 configVersion = uint64((config >> 64) & LOW64BITSMASK);
        if(configVersion != 0) {
            if(configVersion != version()) revert WrongBrevityVersion(version(), configVersion);
        }
        uint128 requestedFlags = uint128(config >> 128);
        //console.log("flags", requestedFlags, this.supportedConfigFlags());
        require(requestedFlags & this.supportedConfigFlags() == requestedFlags, UnsupportedConfigFlags      (requestedFlags & ~this.supportedConfigFlags()));
    }

    function _beforeCall(address to, uint value, uint[] memory resolvedArgs) internal virtual {}
    function _afterRun(
        uint config,
        Instruction[] calldata instructions,
        Quantity[] calldata quantities
    ) internal virtual {}
    /*
    config is: uint128 flags, uint64 requiredBrevityVersion (or 0 for none), uint64 memSize 
    */
    function supportedConfigFlags() public virtual pure returns (uint128) {
        return 0;
    } 

    function _run(
        Program calldata p
    ) internal virtual {
        uint pc = 0;
        //uint steps = 0;
        //uint gasBeforeStart = gasleft();
        uint[] memory mem = new uint[](p.config & LOW64BITSMASK);
        //console.log('allocate registers gas', gasBeforeStart - gasleft());
        while (pc < p.instructions.length) {
            // console.log("step", steps);
            //uint gasBefore = gasleft();
            //steps++;
            uint opcode = p.instructions[pc].opcode;
            bytes32[] calldata args = p.instructions[pc].args;
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
                            p.quantities
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
                    uint160(_resolve(uint(args[1]), mem, p.quantities))
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
                    tmp = _resolve(uint(args[2]), mem, p.quantities);
                    _beforeCall(to, tmp, resolvedArgs);
                    //if no function selector, it's just eth end wo data
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
                if (dest <= p.instructions.length) {
                    pc = dest;
                    continue;
                }
                if (dest == JUMPDEST_RETURN) return;
                if (dest == JUMPDEST_REVERT) revert Reverted(pc);
                revert BadJump(pc, dest);
            } else if (opcode == OPCODE_CMP_BRANCH) {
                // args: quantityNum : qWord, to: uint
                uint val = _resolve(uint(args[0]), mem, p.quantities);
                //console.log('branch v = ', v);
                if (val != 0) {
                    //console.log("op", opcode, "gasUsed", gasBefore - gasleft());
                    uint dest = uint(args[1]);
                    if (dest <= p.instructions.length) {
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
                    p.quantities
                );
            } else if (opcode == OPCODE_DUMPMEM) {
                try IDebugTools(address(this)).printMem(mem, 0, mem.length) {
                     
                } catch {

                }
            } else {
                revert NotPermitted(pc, opcode);
            }
            //console.log("op", opcode, "gasUsed", gasBefore - gasleft());
            pc++;
        }
        _afterRun(p.config, p.instructions, p.quantities);
    }

}
