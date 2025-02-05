pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract TestCoin is ERC20Burnable, Ownable {
    constructor(string memory name, string memory symbol, uint amount) ERC20(name, symbol) Ownable(msg.sender) {
        mint(amount);
    }

    function mint(uint amount) public onlyOwner() {
        _mint(msg.sender, amount);
    }
    
}