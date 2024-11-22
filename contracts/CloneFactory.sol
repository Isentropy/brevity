pragma solidity ^0.8.27;

import "@openzeppelin/contracts/proxy/Clones.sol";

interface SetOwner {
    function setOwner(address owner_) external; 
}

contract CloneFactory {

    event NewClone(address indexed owner, address indexed cloneAddress, address indexed implementation);

    function cloneDeterministic(address implementation, bytes32 salt, address owner) external returns (address) {
        bytes32 newSalt = keccak256(abi.encodePacked(salt, owner));
        address cloneAddress = Clones.cloneDeterministic(implementation, newSalt);
        SetOwner(cloneAddress).setOwner(owner);
        emit NewClone(owner, cloneAddress, implementation);
        return cloneAddress;
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