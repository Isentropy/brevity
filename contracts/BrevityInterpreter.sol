pragma solidity ^0.8.27;

import './LibInterpreter.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/Nonces.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract BrevityInterpreter is Ownable, EIP712, Nonces {
    constructor() Ownable(msg.sender) EIP712("Brev", "1") {}

    bytes32 private constant _RUN_TYPEHASH = keccak256("Run(uint256 memSize,Instruction[] instructions,Quantity[] quantities,uint256 nonce)Instruction(uint256 opcode,bytes32[] args)Quantity(uint256 quantityType,bytes32[] args)");
    bytes32 private constant _INSTRUCTION_TYPEHASH = keccak256("Instruction(uint256 opcode,bytes32[] args)");
    bytes32 private constant _QUANTITY_TYPEHASH = keccak256("Quantity(uint256 quantityType,bytes32[] args)");


    function run(uint memSize, Interpreter.Instruction[] calldata instructions, Interpreter.Quantity[] calldata quantities) public  {
        Interpreter._run(memSize, instructions, quantities);
    }
    function _encodeInstructionsArray(Interpreter.Instruction[] calldata instrutions) internal pure returns (bytes32) {
        bytes32[] memory slots = new bytes32[](instrutions.length);
        for(uint i=0; i<instrutions.length; i++) {
            slots[i] = keccak256(abi.encode(_INSTRUCTION_TYPEHASH,  instrutions[i].opcode, keccak256(abi.encodePacked(instrutions[i].args))));
        }
        // no length
        return keccak256(abi.encodePacked(slots));
    }

    function _encodeQuantityArray(Interpreter.Quantity[] calldata quantities) internal pure returns (bytes32) {
        bytes32[] memory slots = new bytes32[](quantities.length);
        for(uint i=0; i<quantities.length; i++) {
            slots[i] = keccak256(abi.encode(_QUANTITY_TYPEHASH, quantities[i].quantityType, keccak256(abi.encodePacked(quantities[i].args))));
        }
        // no length
        return keccak256(abi.encodePacked(slots));
    }

    function runMeta(
        uint memSize, Interpreter.Instruction[] calldata instructions, Interpreter.Quantity[] calldata quantities,
        bytes calldata sig) public {

        //arrays hashed per https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md
        bytes32 structHash = keccak256(abi.encode(_RUN_TYPEHASH, memSize, _encodeInstructionsArray(instructions), _encodeQuantityArray(quantities), _useNonce(owner())));
        bytes32 hash = _hashTypedDataV4(structHash);


        require(owner() == ECDSA.recover(hash, sig), "invalid signature");
        Interpreter._run(memSize, instructions, quantities);
    }
    
    function noop(uint memSize, Interpreter.Instruction[] calldata program, Interpreter.Quantity[] calldata quantities) public {}

    receive() payable external {}



    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

}

