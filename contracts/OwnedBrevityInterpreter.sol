pragma solidity ^0.8.27;

import './BrevityInterpreter.sol';
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./DebugTools.sol";
import "./PermissionedBrevityInterpreter.sol";

contract OwnedBrevityInterpreter is PermissionedBrevityInterpreter {

    address public owner;

    constructor(address owner_) {
        setOwner(owner_);
    }

    function _admin() internal virtual override returns (address) {
        return owner;
    }

    function setOwner(address owner_) public {
        require(owner == address(0), OwnerAlreadySet());
        owner = owner_;
        emit NewOwner(owner_);
    }

    function withdraw(address token, uint amount) public onlyAdmin {
        _withdraw(token, amount);
    }

    function withdrawAll(address token) public onlyAdmin {
        uint bal = this.withdrawableBalance(token);
        _withdraw(token, bal);
    }

    function withdrawAllMulti(address[] calldata tokens) public onlyAdmin {
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
            (bool success, ) = payable(owner).call{value: amount}("");
            require(success, TransferFailed(token, address(this), owner, amount));
        } else {
            require(
                IERC20(token).transfer(owner, amount),
                TransferFailed(token, address(this), owner, amount)
            );
        }
    }

}

