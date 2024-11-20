pragma solidity ^0.8.27;
import './IBrevityInterpreter.sol';
import "@openzeppelin/contracts/utils/Nonces.sol";
//import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
//import "@openzeppelin/contracts/access/Ownable.sol";
//import "@openzeppelin/contracts/proxy/Proxy.sol";

// for testing only
contract OwnedBrevityInterpreterProxy is IBrevityInterpreter, Nonces {
    address public immutable owner;
    IBrevityInterpreter public immutable proxyTo;
    constructor(address owner_, address proxyTo_) {
        owner = owner_;
        proxyTo = IBrevityInterpreter(proxyTo_);
    }

    function _delegate(address implementation) internal virtual {
        assembly {
            // Copy msg.data. We take full control of memory in this inline assembly
            // block because it will not return to Solidity code. We overwrite the
            // Solidity scratch pad at memory position 0.
            calldatacopy(0, 0, calldatasize())

            // Call the implementation.
            // out and outsize are 0 because we don't know the size yet.
            let result := delegatecall(gas(), implementation, 0, calldatasize(), 0, 0)

            // Copy the returned data.
            returndatacopy(0, 0, returndatasize())

            switch result
            // delegatecall returns 0 on error.
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    function runMeta (
        Brevity.Program calldata p,
        bytes calldata sig, uint nonce, address signer) public payable override {
            require(signer == owner);
            require(nonce == _useNonce(owner));
            require(Brevity.CONFIGFLAG_NO_DELEGATECALL & p.config == Brevity.CONFIGFLAG_NO_DELEGATECALL);
            _delegate(address(proxyTo));
    }

    function noop(Brevity.Program calldata p) public payable override {}

    function run(Brevity.Program calldata p) public payable override {
        require(msg.sender == owner);
        require(Brevity.CONFIGFLAG_NO_DELEGATECALL & p.config == Brevity.CONFIGFLAG_NO_DELEGATECALL);
        _delegate(address(proxyTo));
    }


    fallback() external payable {}
    

}