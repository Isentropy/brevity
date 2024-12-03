pragma solidity ^0.8.27;

import './BrevityInterpreter.sol';
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Nonces.sol";

contract OwnedBrevityInterpreter is EIP712, Nonces, BrevityInterpreter {
    uint public constant version = 1;
    event NewOwner(address indexed newOwner);

    address public owner;
    constructor(address owner_) EIP712("Brev", "1") {
        setOwner(owner_);
    }

    function setOwner(address owner_) public {
        require(owner == address(0), "ownerAlreadySet");
        owner = owner_;
        emit NewOwner(owner_);
    }

    function run(Program calldata p) public payable {
        require(owner == msg.sender, "notOwner");
        _run(p.config, p.instructions, p.quantities);
    }

    function runMeta(
        Program calldata p,
        uint deadline,
        bytes calldata sig) public payable virtual {
        //arrays hashed per https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md
        require(deadline >= block.timestamp, "expired");
        bytes32 structHash = keccak256(abi.encode(_PROGRAM_TYPEHASH, p.config, _encodeInstructionsArray(p.instructions), _encodeQuantityArray(p.quantities), _useNonce(owner), deadline));
        bytes32 hash = _hashTypedDataV4(structHash);
        require(owner == ECDSA.recover(hash, sig), "invalid signature");
        _run(p.config, p.instructions, p.quantities);
    }

    
    function noop(Program calldata p) public payable {}

    receive() payable external {}

    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

}

