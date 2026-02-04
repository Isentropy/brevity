pragma solidity ^0.8.27;
import "hardhat/console.sol";
import "./IDebugTools.sol";


contract DebugTools is IDebugTools {
    event KeyValue(uint key, uint val);
    // defined for convenience
    function emitKeyValue(uint key, uint val) public {
        emit KeyValue(key, val);
    }
    function consoleLog(string memory logData) public  pure {
        console.log(logData);
    }
    function log0(bytes memory logData) public {
        assembly {
            log0(add(logData, 32), mload(logData))
        }
    }
    function log1(uint256 topic1, bytes memory logData) public {
        assembly {
            log1(add(logData, 32), mload(logData), topic1)
        }
    }
    function log2(uint256 topic1, uint256 topic2, bytes memory logData) public {
        assembly {
            log2(add(logData, 32), mload(logData), topic1, topic2)
        }
    }
    function log3(uint256 topic1, uint256 topic2, uint256 topic3, bytes memory logData) public {
        assembly {
            log3(add(logData, 32), mload(logData), topic1, topic2, topic3)
        }
    }
    function log4(uint256 topic1, uint256 topic2, uint256 topic3, uint256 topic4, bytes memory logData) public {
        assembly {
            log4(add(logData, 32), mload(logData), topic1, topic2, topic3, topic4)
        }
    }

    function printMem(uint[] memory mem, uint from, uint to) public pure {
        console.log("Mem Dump:");
        for (uint i = from; i < to; i++) {
            console.log(i, " = ", mem[i]);
        }
    }
}