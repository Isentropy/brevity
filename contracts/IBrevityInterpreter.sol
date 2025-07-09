pragma solidity ^0.8.27;
pragma abicoder v2;

import "./Constants.sol";
import "@openzeppelin/contracts/utils/Nonces.sol";

interface IBrevityInterpreter {

    function version() external pure returns (uint);
    function run(Program calldata p) external payable;
    function noop(Program calldata p) external payable;
    function runMeta(
        Program calldata p,
        uint deadline,
        bytes calldata sig
    ) external payable;
    function nonces(address signer) external view returns (uint256);
}
