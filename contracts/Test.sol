pragma solidity ^0.8.27;
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import './MintableERC20.sol';

contract Test {
   
   function swap(IERC20 tokenA, uint exactInTokenA, MintableERC20 tokenB) public returns (uint) {
      tokenA.transferFrom(msg.sender, address(this), exactInTokenA);
      tokenB.mint(msg.sender, 2*exactInTokenA);
   }

   function foo(uint x) public view returns (uint) {
      return 2*x;
   }
}

