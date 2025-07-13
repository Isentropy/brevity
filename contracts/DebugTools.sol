pragma solidity ^0.8.27;
import "hardhat/console.sol";

contract DebugTools {
    function consoleLog(string memory logData) public pure {
        console.log(logData);
    }
    function log0(bytes memory logData) public {
        assembly {
            log0(logData, mload(logData))
        }
    }
    function log1(uint256 topic1, bytes memory logData) public {
        assembly {
            log1(logData, mload(logData), topic1)
        }
    }
    function log2(uint256 topic1, uint256 topic2, bytes memory logData) public {
        assembly {
            log2(logData, mload(logData), topic1, topic2)
        }
    }
    function log3(uint256 topic1, uint256 topic2, uint256 topic3, bytes memory logData) public {
        assembly {
            log3(logData, mload(logData), topic1, topic2, topic3)
        }
    }
    function log4(uint256 topic1, uint256 topic2, uint256 topic3, uint256 topic4, bytes memory logData) public {
        assembly {
            log4(logData, mload(logData), topic1, topic2, topic3, topic4)
        }
    }
}