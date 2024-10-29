// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './MintableERC20.sol';

interface ISwap {
    function swap(address tokenA, uint amountA, address tokenB) external;
}

contract Arb {
    function arb(IERC20 tokenA, IERC20 tokenB, uint amountA, uint minProfitA, ISwap exchange1, ISwap exchange2) public {
        uint ABefore = tokenA.balanceOf(address(this));
        tokenA.approve(address(exchange1), amountA);
        uint BBefore = tokenB.balanceOf(address(this));
        exchange1.swap(address(tokenA), amountA, address(tokenB));
        uint amountB = tokenB.balanceOf(address(this)) - BBefore;
        tokenB.approve(address(exchange1), amountB);
        exchange2.swap(address(tokenB), amountB, address(tokenA));
        require(tokenA.balanceOf(address(this)) > ABefore + minProfitA);
    }

}