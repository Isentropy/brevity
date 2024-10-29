pragma solidity ^0.8.27;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import './MintableERC20.sol';
contract TestToken is ERC20, MintableERC20 {
    function mint(address to, uint amount) override public {
        _mint(to, amount);
    }

    constructor() ERC20("test", "T") {}

}