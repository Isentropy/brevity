pragma solidity ^0.8.27;

import './IBrevityInterpreter.sol';
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// for testing only
contract BrevityInterpreter is EIP712, IBrevityInterpreter {
    constructor() EIP712("Brev", "1") {}

    function run(Brevity.Program calldata p) public payable override {
        Brevity._run(p.config, p.instructions, p.quantities);
    }

    function runMeta(
        Brevity.Program calldata p,
        bytes calldata sig, uint nonce, address signer) public payable virtual override {
        //arrays hashed per https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md
        bytes32 structHash = keccak256(abi.encode(Brevity._PROGRAM_TYPEHASH, p.config, Brevity._encodeInstructionsArray(p.instructions), Brevity._encodeQuantityArray(p.quantities), nonce));
        bytes32 hash = _hashTypedDataV4(structHash);
        require(signer == ECDSA.recover(hash, sig), "invalid signature");
        Brevity._run(p.config, p.instructions, p.quantities);
    }
    
    function noop(Brevity.Program calldata p) public payable override {}
    function nonces(address user) public view returns (uint256) { return 0; }
    receive() payable external {}

    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

}

