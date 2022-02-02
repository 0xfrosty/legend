// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title IERC20VestingWallet
 * @dev Interface for vesting contracts of an ERC20 token for a given beneficiary. Custody of tokens can be given to
 * a contract that implements this interface, which will release them following a given vesting schedule.
 */
interface IERC20VestingWallet {

    /**
     * @dev Emitted when `amount` tokens are released for the beneficiary
     * @param beneficiary Recipient of the tokens
     * @param token Address of the ERC20 contract
     * @param amount Number of tokens released
     */
    event ERC20Released(address indexed beneficiary, address token, uint256 amount);

    /**
     * @dev Initialize vesting wallet after deployment (can only be called once)
     * @param token Address of the ERC20 token which is vested
     * @param beneficiary Beneficiary of the vested ERC20 tokens
     * @param startTimestamp UNIX timestamp when the vesting period starts
     * @param durationSeconds Duration of the linear vesting schedule
     */
    function initialize(
        address token,
        address beneficiary,
        uint64 startTimestamp,
        uint64 durationSeconds
    ) external;

    /**
     * @dev Getter for the ERC20 token address
     */
    function getToken() external view returns (address);

    /**
     * @dev Getter for the beneficiary address
     */
    function getBeneficiary() external view returns (address);

    /**
     * @dev Getter for the vesting start timestamp
     */
    function getStart() external view returns (uint256);

    /**
     * @dev Getter for the vesting duration
     */
    function getDuration() external view returns (uint256);

    /**
     * @dev Amount of token already released
     */
    function released() external view returns (uint256);

    /**
     * @dev Release the tokens that have already vested
     *
     * Emit an {ERC20Released} event.
     */
    function release() external;

    /**
     * @dev Calculates the amount of tokens that beneficiary has already vested at {timestamp}
     * @param timestamp UNIX timestamp at which the vested amount is computed
     * @return Vested amount at {timestamp}
     */
    function vestedAmount(uint64 timestamp) external view returns (uint256);
}
