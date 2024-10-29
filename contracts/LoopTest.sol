// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import './MintableERC20.sol';

contract LoopTest {
   // function test(address payable)
   function loop(int n) public {
      for(int i = 0; i < n; i++) {}
   }
}

