pragma solidity ^0.8.27;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./IBrevityInterpreter.sol";

interface SetOwner {
    function setOwner(address owner_) external; 
}

contract CloneFactory {
    function isContract(address account) internal view returns (bool) {
        // This method relies on extcodesize, which returns 0 for contracts in
        // construction, since the code is only stored at the end of the
        // constructor execution.

        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }

    event NewClone(address indexed owner, address indexed cloneAddress, address indexed implementation);


    // should error if destination contract already exists
    function cloneDeterministic(address implementation, bytes32 salt, address owner) public returns (address) {
        bytes32 newSalt = keccak256(abi.encodePacked(salt, owner));
        address cloneAddress = Clones.cloneDeterministic(implementation, newSalt);
        SetOwner(cloneAddress).setOwner(owner);
        emit NewClone(owner, cloneAddress, implementation);
        return cloneAddress;
    }

    function cloneIfNeededThenRun(address implementation, bytes32 salt, address owner, Program memory p, uint deadline, bytes memory sig) public payable returns (address) {
        bytes32 newSalt = keccak256(abi.encodePacked(salt, owner));
        address payable clone = payable(Clones.predictDeterministicAddress(implementation, newSalt, address(this)));
        if(!isContract(clone)) cloneDeterministic(implementation, salt, owner);
        IBrevityInterpreter(clone).runMeta{value: msg.value}(p, deadline, sig);
        return clone;
    }
    
    function predictDeterministicAddress(
        address implementation,
        bytes32 salt,
        address owner
    ) external view returns (address predicted) {
        bytes32 newSalt = keccak256(abi.encodePacked(salt, owner));
        return Clones.predictDeterministicAddress(implementation, newSalt, address(this));
    }

}