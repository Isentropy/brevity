pragma solidity ^0.8.27;

import './LibInterpreter.sol';

interface IBrevityInterpreter  {
    function run(Brevity.Program calldata p) external virtual payable;
    function noop(Brevity.Program calldata p) external virtual payable;
    //function nonces(address owner) external view virtual returns (uint256);
    // should revert if signer doesn't match, ow call run(p)
    function runMeta(Brevity.Program calldata p, bytes calldata sig, uint nonce, address signer) external virtual payable;
}