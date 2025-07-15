pragma solidity ^0.8.27;

import './TestToken.sol';
import './MintableERC20.sol';

// anyone can mint. only for testing

contract TestTokenMultiMint is TestToken, MintableERC20 {
    function mint(address to, uint256 amount) public virtual override {
        _mint(to, amount);
    }
}