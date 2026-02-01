pragma solidity ^0.8.27;

import "../OwnedBrevityInterpreter.sol";
import {SafeCallback} from "@uniswap/v4-periphery/src/base/SafeCallback.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import "../Constants.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {ModifyLiquidityParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";

contract Uniswap4FlashBrevityInterpreter is
    OwnedBrevityInterpreter,
    SafeCallback
{
    constructor(
        address owner_,
        IPoolManager poolManager_
    ) OwnedBrevityInterpreter(owner_) SafeCallback(poolManager_) {
    }
    
    function unlockAndRun(Program calldata p) public onlyOwner {
        poolManager.unlock(abi.encode(p));
    }
    

    function _unlockCallback(
        bytes calldata data
    ) internal virtual override returns (bytes memory) {
        Program calldata p;
        assembly {
            // decode in calldata. its already abi.encoded
            p := add(data.offset, 32)
        }
        //console.log("pre run");
        _run(p.config, p.instructions, p.quantities);
        //console.log("run");
        return "";
    }
}
