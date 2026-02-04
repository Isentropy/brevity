pragma solidity ^0.8.27;

import './BrevityInterpreter.sol';
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./DebugTools.sol";

contract OwnedBrevityInterpreter is EIP712, BrevityInterpreter, DebugTools {

    event NewOwner(address indexed newOwner);
    error NotOwner();
    error OwnerAlreadySet();
    error TransferFailed(address erc20, address from, address to, uint amount);

    modifier onlyOwner() {
        // msg.sender == address(this) allows self-calls
        require(msg.sender == owner || msg.sender == address(this), NotOwner());
        _;
    }

    address public owner;
    constructor(address owner_) EIP712("Brev", "1") {
        setOwner(owner_);
    }

    function setOwner(address owner_) public {
        require(owner == address(0), OwnerAlreadySet());
        owner = owner_;
        emit NewOwner(owner_);
    }

    function run(Program calldata p) external payable virtual override {
        _validateConfig(p.config);
        require(owner == msg.sender, NotOwner());
        _run(p);
    }

    function runMeta(
        Program calldata p,
        uint deadline,
        bytes calldata sig) external payable virtual override {
        _validateConfig(p.config);
        //arrays hashed per https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md
        require(deadline >= block.timestamp, "expired");
        bytes32 structHash = keccak256(abi.encode(_PROGRAM_TYPEHASH, p.config, _encodeInstructionsArray(p.instructions), _encodeQuantityArray(p.quantities), _useNonce(owner), deadline));
        bytes32 hash = _hashTypedDataV4(structHash);
        require(owner == ECDSA.recover(hash, sig), "invalid signature");
        _run(p);
    }

    function withdraw(address token, uint amount) public onlyOwner {
        _withdraw(token, amount);
    }

    function withdrawAll(address token) public onlyOwner {
        uint bal = this.withdrawableBalance(token);
        _withdraw(token, bal);
    }

    function withdrawAllMulti(address[] calldata tokens) public onlyOwner {
        for(uint i=0; i < tokens.length; i++) {
            withdrawAll(tokens[i]);
        }
    }

    function withdrawableBalance(address token) public virtual view returns (uint256) {
        if (token == address(0)) return address(this).balance;
        else return IERC20(token).balanceOf(address(this));
    }

    function _withdraw(address token, uint amount) internal virtual {
        if (token == address(0)) {
            payable(owner).transfer(amount);
        } else {
            require(
                IERC20(token).transfer(owner, amount),
                TransferFailed(token, address(this), owner, amount)
            );
        }
    }

    
    function noop(Program calldata p) public payable {}

    receive() payable external {}

    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

}

