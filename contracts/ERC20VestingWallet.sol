// SPDX-License-Identifier: MIT
// Adapted from OpenZeppelin Contracts v4.4.1 (finance/VestingWallet.sol)
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title ERC20VestingWallet
 * @dev This contract handles the vesting of an ERC20 token for a given beneficiary. Custody of tokens can be given to
 * this contract, which will release them to the beneficiary following a given vesting schedule. The vesting schedule
 * is customizable through the {vestedAmount} function.
 *
 * Any token transferred to this contract will follow the vesting schedule as if they were locked from the beginning.
 * Consequently, if the vesting has already started, any amount of tokens sent to this contract will (at least partly)
 * be immediately releasable.
 */
contract ERC20VestingWallet is Context {
    using Address for address;
    using Math for uint256;

    event ERC20Released(address indexed token, uint256 amount);

    address private immutable _token;
    address private immutable _beneficiary;
    uint256 private _released;
    uint64 private immutable _start;
    uint64 private immutable _duration;

    /**
     * @dev Set the token, beneficiary, start timestamp and vesting duration of the vesting wallet.
     */
    constructor(
        address tokenAddress,
        address beneficiaryAddress,
        uint64 startTimestamp,
        uint64 durationSeconds
    ) {
        require(tokenAddress.isContract(), "ERC20VestingWallet: ERC20 address is not contract");
        require(beneficiaryAddress != address(0), "ERC20VestingWallet: beneficiary is zero address");
        _token = tokenAddress;
        _beneficiary = beneficiaryAddress;
        _start = startTimestamp;
        _duration = durationSeconds;
    }

    /**
     * @dev Getter for the ERC20 token address.
     */
    function token() public view virtual returns (address) {
        return _token;
    }

    /**
     * @dev Getter for the beneficiary address.
     */
    function beneficiary() public view virtual returns (address) {
        return _beneficiary;
    }

    /**
     * @dev Getter for the start timestamp.
     */
    function start() public view virtual returns (uint256) {
        return _start;
    }

    /**
     * @dev Getter for the vesting duration.
     */
    function duration() public view virtual returns (uint256) {
        return _duration;
    }

    /**
     * @dev Amount of token already released
     */
    function released() public view virtual returns (uint256) {
        return _released;
    }

    /**
     * @dev Release the tokens that have already vested.
     *
     * Emits a {ERC20Released} event.
     */
    function release() public virtual {
        uint256 releasable = vestedAmount(uint64(block.timestamp)) - released();
        _released += releasable;
        emit ERC20Released(token(), releasable);
        SafeERC20.safeTransfer(IERC20(token()), beneficiary(), releasable);
    }

    /**
     * @dev Calculates the amount of tokens that has already vested. Default implementation is a linear vesting curve.
     */
    function vestedAmount(uint64 timestamp) public view virtual returns (uint256) {
        return _vestingSchedule(IERC20(token()).balanceOf(address(this)) + released(), timestamp);
    }

    /**
     * @dev Virtual implementation of the vesting formula. This returns the amout vested, as a function of time, for
     * an asset given its total historical allocation.
     */
    function _vestingSchedule(uint256 totalAllocation, uint64 timestamp) internal view virtual returns (uint256) {
        if (timestamp < start()) {
            return 0;
        } else if (timestamp > start() + duration()) {
            return totalAllocation;
        } else {
            return (totalAllocation * (timestamp - start())) / duration();
        }
    }
}
