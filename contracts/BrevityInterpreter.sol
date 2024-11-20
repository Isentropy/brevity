pragma solidity ^0.8.27;

import './LibInterpreter.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/Nonces.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// for testing only
contract BrevityInterpreter is Ownable, EIP712, Nonces {
    constructor() Ownable(msg.sender) EIP712("Brev", "1") {}


    function run(uint memSize, Brevity.Instruction[] calldata instructions, Brevity.Quantity[] calldata quantities) public payable {
        Brevity._run(memSize, instructions, quantities);
    }

    function runMeta(
        uint memSize, Brevity.Instruction[] calldata instructions, Brevity.Quantity[] calldata quantities,
        bytes calldata sig) public {
        //arrays hashed per https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md
        bytes32 structHash = keccak256(abi.encode(Brevity._RUN_TYPEHASH, memSize, Brevity._encodeInstructionsArray(instructions), Brevity._encodeQuantityArray(quantities), _useNonce(owner())));
        bytes32 hash = _hashTypedDataV4(structHash);
        require(owner() == ECDSA.recover(hash, sig), "invalid signature");
        Brevity._run(memSize, instructions, quantities);
    }
    
    function noop(uint memSize, Brevity.Instruction[] calldata program, Brevity.Quantity[] calldata quantities) public {}

    receive() payable external {}



    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

}

