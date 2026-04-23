pragma solidity ^0.8.27;

import './BrevityInterpreter.sol';
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./DebugTools.sol";

abstract contract PermissionedBrevityInterpreter is EIP712, BrevityInterpreter {

    event NewOwner(address indexed newOwner);
    error NotOwner();
    error OwnerAlreadySet();
    error TransferFailed(address erc20, address from, address to, uint amount);
    modifier onlyAdmin() {
        // msg.sender == address(this) allows self-calls
        require(msg.sender == _admin(), NotOwner());
        _;
    }

    constructor() EIP712("Brev", "1") {}

    function _admin() internal virtual returns (address);

    function _canRun(address runner) internal virtual returns (bool) {
        return runner == _admin();
    }
    
    function run(Program calldata p) external payable virtual override {
        _validateConfig(p.config);
        require(_canRun(msg.sender), NotPermitted(0, 0));
        _run(p, msg.sender);
    }

    function runMeta(
        Program calldata p,
        uint deadline,
        address runner,
        bytes calldata sig) external payable virtual override {
        _validateConfig(p.config);
        //arrays hashed per https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md
        require(deadline >= block.timestamp, Expired());
        bytes32 structHash = keccak256(abi.encode(_PROGRAM_TYPEHASH, p.config, _encodeInstructionsArray(p.instructions), _encodeQuantityArray(p.quantities), _useNonce(runner), deadline));
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, sig);
        require(signer == runner && _canRun(runner), NotPermitted(0, 0));
        _run(p, runner);
    }
    
    function noop(Program calldata p) public payable {}

    receive() payable external {}

    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

}

