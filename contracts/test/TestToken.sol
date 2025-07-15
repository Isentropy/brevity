pragma solidity ^0.8.27;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

// token that supports cloning. can be minted once by anyone

error AlreadInitialized();


contract TestToken is ERC20 {
    // needed bc ERC20 is private. not supported by clone
    //string internal newName;
    string internal newSymbol;
    

    function init(string calldata symbol_, address mintTo, uint mintAmount) public {
        require(totalSupply() == 0, AlreadInitialized());
        //newName = name_;
        newSymbol = symbol_;
        _mint(mintTo, mintAmount);
    }

    function name() public view virtual override returns (string memory) {
        return newSymbol;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view virtual override returns (string memory) {
        return newSymbol;
    }

    constructor() ERC20("test", "T") {
        _mint(msg.sender, 10000000000 ether);
    }

}