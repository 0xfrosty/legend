// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title IERC20VestingWallet
 * @dev Interface for vesting contracts of an ERC20 token for a given beneficiary. Custody of tokens can be given to
 * a contract that implements this interface, which will release them to the beneficiary following a given vesting
 * schedule.
 */
interface IERC20VestingWallet {

    event ERC20Released(address token, uint256 amount);

    function initialize(
        address tokenAddress,
        address beneficiaryAddress,
        uint64 startTimestamp,
        uint64 durationSeconds
    ) external;

    /**
     * @dev Getter for the ERC20 token address.
     */
    function token() external view returns (address);

    /**
     * @dev Getter for the beneficiary address.
     */
    function beneficiary() external view returns (address);

    /**
     * @dev Getter for the start timestamp.
     */
    function start() external view returns (uint256);

    /**
     * @dev Getter for the vesting duration.
     */
    function duration() external view returns (uint256);

    /**
     * @dev Amount of token already released
     */
    function released() external view returns (uint256);

    /**
     * @dev Release the tokens that have already vested.
     *
     * Emits a {ERC20Released} event.
     */
    function release() external;

    /**
     * @dev Calculates the amount of tokens that has already vested.
     */
    function vestedAmount(uint64 timestamp) external view returns (uint256);
}
