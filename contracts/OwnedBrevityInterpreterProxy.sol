pragma solidity ^0.8.27;
import "@openzeppelin/contracts/utils/Nonces.sol";
//import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
//import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Proxy.sol";

// for testing only
contract OwnedBrevityInterpreterProxy is Proxy {
    address public immutable proxyTo;

    constructor(address proxyTo_) {
        proxyTo = proxyTo_;
    }

    function _implementation() internal view override returns (address) {
        return proxyTo;
    }

}