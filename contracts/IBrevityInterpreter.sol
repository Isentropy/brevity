pragma solidity ^0.8.27;

import './LibInterpreter.sol';

interface IBrevityInterpreter  {
    function version() external pure returns (uint);

}