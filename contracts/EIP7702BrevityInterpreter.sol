pragma solidity ^0.8.27;

import './PermissionedBrevityInterpreter.sol';
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./DebugTools.sol";

contract EIP7702BrevityInterpreter is PermissionedBrevityInterpreter {
    /*
        EIP7702 delegation makes the code of this contract control a wallet
        msg.sender will be this address when the wallet sends txs
    */
    function _admin() internal virtual override returns (address) {
        return address(this);
    }

}
