pragma solidity ^0.8.27;

import "../OwnedBrevityInterpreter.sol";
import {SafeCallback} from "@uniswap/v4-periphery/src/base/SafeCallback.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import "../Constants.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {ModifyLiquidityParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import "../DebugTools.sol";
contract Uniswap4FlashBrevityInterpreter is DebugTools,
    OwnedBrevityInterpreter,
    SafeCallback
{
    constructor(
        address owner_,
        IPoolManager poolManager_
    ) OwnedBrevityInterpreter(owner_) SafeCallback(poolManager_) {
    }

    function supportedConfigFlags() public virtual override pure returns (uint128) {
        return CONFIGFLAG_UNISWAP4UNLOCK | super.supportedConfigFlags();
    }

    function _run(
        Program calldata p,
        address runner
    ) internal virtual override {
        //top uint128 is flags
        if((p.config >> 128) & CONFIGFLAG_UNISWAP4UNLOCK != 0) {
            poolManager.unlock(abi.encode(runner, p));
        } else {
            super._run(p, runner);
        }
    }

    function _unlockCallback(
        bytes calldata data
    ) internal virtual override returns (bytes memory) {
        Program calldata p;
        address runner;
        assembly {
            // first 32b contain runner
            runner := calldataload(data.offset)
            // program starts in offset 64. decode in calldata. its already abi.encoded
            p := add(data.offset, 64)
        }
        //console.log("pre run");
        super._run(p, runner);
        //console.log("run");
        return "";
    }
}
