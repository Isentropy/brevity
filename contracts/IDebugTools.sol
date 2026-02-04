pragma solidity ^0.8.27;

interface IDebugTools {
    function consoleLog(string memory logData) external;
    function log0(bytes memory logData) external;
    function log1(uint256 topic1, bytes memory logData) external;
    function log2(uint256 topic1, uint256 topic2, bytes memory logData) external;
    function log3(uint256 topic1, uint256 topic2, uint256 topic3, bytes memory logData) external;
    function log4(uint256 topic1, uint256 topic2, uint256 topic3, uint256 topic4, bytes memory logData) external; 
    function printMem(uint[] memory mem, uint from, uint to) external pure;
}