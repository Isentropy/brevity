// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (utils/Nonces.sol)
pragma solidity ^0.8.20;

/**
 * @dev Provides tracking nonces for addresses. Nonces will only increment.
 * this is based on OZ Nonces and implements nonces for bytes32 key
 */
abstract contract NoncesBytes32 {
    /**
     * @dev The nonce used for an `account` is not the expected current nonce.
     */
    error InvalidNonce(bytes32 key, uint256 currentNonce);

    mapping(bytes32 account => uint256) private _nonces;

    /**
     * @dev Returns the next unused nonce for an bytes32.
     */
    function nonces(bytes32 owner) public view virtual returns (uint256) {
        return _nonces[owner];
    }
    function nonces(address owner) public view virtual returns (uint256) {
        return nonces(bytes32(uint256(uint160(owner))));
    }
    /**
     * @dev Consumes a nonce.
     *
     * Returns the current value and increments nonce.
     */
    function _useNonce(bytes32 owner) internal virtual returns (uint256) {
        // For each account, the nonce has an initial value of 0, can only be incremented by one, and cannot be
        // decremented or reset. This guarantees that the nonce never overflows.
        unchecked {
            // It is important to do x++ and not ++x here.
            return _nonces[owner]++;
        }
    }
    function _useNonce(address owner) internal virtual returns (uint256) {
        return _useNonce(bytes32(uint256(uint160(owner))));
    }

    /**
     * @dev Same as {_useNonce} but checking that `nonce` is the next valid for `owner`.
     */
    function _useCheckedNonce(bytes32 owner, uint256 nonce) internal virtual {
        uint256 current = _useNonce(owner);
        if (nonce != current) {
            revert InvalidNonce(owner, current);
        }
    }
    
    function _useCheckedNonce(address owner, uint256 nonce) internal virtual {
            return _useCheckedNonce(bytes32(uint256(uint160(owner))), nonce);
    }
}
