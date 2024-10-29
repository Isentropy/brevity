// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

interface MintableERC20 is IERC20 {
   function mint(address to, uint amount) external;
}