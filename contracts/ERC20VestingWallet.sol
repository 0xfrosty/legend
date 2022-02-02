// SPDX-License-Identifier: MIT
// Initially based on OpenZeppelin Contracts v4.4.1 (finance/VestingWallet.sol)
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./IERC20VestingWallet.sol";

/**
 * @title ERC20VestingWallet
 * @dev This contract handles the vesting of an ERC20 token for a given beneficiary. Custody of tokens can be given to
 * this contract, which will release them to the beneficiary following a linear schedule. Child contracts may change
 * the vesting schedule by overriding the {vestedAmount} function.
 *
 * Any token transferred to this contract will follow the vesting schedule as if they were locked from the beginning.
 * Consequently, if the vesting has already started, any amount of tokens sent to this contract will (at least partly)
 * be immediately releasable.
 *
 * Since there's a wallet per beneficiary and vesting schedule, this contract is expected to be deployed from a
 * factory using the clone (or an alternative minimal proxy) pattern in order to save gas. Such a factory must
 * guarantee that this contract is initialized by calling {initialize}.
 */
contract ERC20VestingWallet is IERC20VestingWallet, Initializable {
    using Address for address;

    address private _token;
    address private _beneficiary;
    uint256 private _released;
    uint64 private _start;
    uint64 private _duration;

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
    )
        external
        initializer
    {
        require(token.isContract(), "ERC20 address is not a contract");
        require(beneficiary != address(0), "Beneficiary is zero address");
        _token = token;
        _beneficiary = beneficiary;
        _start = startTimestamp;
        _duration = durationSeconds;
    }

    /**
     * @dev Release the tokens that have already vested
     *
     * Emit an {ERC20Released} event.
     */
    function release() public {
        uint256 releasable = vestedAmount(uint64(block.timestamp)) - released();
        _released += releasable;
        emit ERC20Released(getBeneficiary(), getToken(), releasable);
        SafeERC20.safeTransfer(IERC20(getToken()), getBeneficiary(), releasable);
    }

    /**
     * @dev Amount of token already released
     */
    function released() public view returns (uint256) {
        return _released;
    }

    /**
     * @dev Calculates the amount of tokens that beneficiary has already vested at {timestamp}
     * @param timestamp UNIX timestamp at which the vested amount is computed
     * @return Vested amount at {timestamp}
     */
    function vestedAmount(uint64 timestamp) public view virtual returns (uint256) {
        return _linearVesting(IERC20(getToken()).balanceOf(address(this)) + released(), timestamp);
    }

    /**
     * @dev Getter for the ERC20 token address
     */
    function getToken() public view returns (address) {
        return _token;
    }

    /**
     * @dev Getter for the beneficiary address
     */
    function getBeneficiary() public view returns (address) {
        return _beneficiary;
    }

    /**
     * @dev Getter for the vesting start timestamp
     */
    function getStart() public view returns (uint256) {
        return _start;
    }

    /**
     * @dev Getter for the vesting duration
     */
    function getDuration() public view returns (uint256) {
        return _duration;
    }

    /**
     * @dev Linear implementation of the vesting formula. This returns the amout vested, as a function of time, for
     * an asset given its total historical allocation.
     * @param totalAllocation Total allocation of tokens for beneficiary
     * @param timestamp UNIX timestamp at which the vested amount is computed
     */
    function _linearVesting(uint256 totalAllocation, uint64 timestamp) internal view returns (uint256) {
        if (timestamp < getStart()) {
            return 0;

        } else if (timestamp > getStart() + getDuration()) {
            return totalAllocation;

        } else {
            return (totalAllocation * (timestamp - getStart())) / getDuration();

        }
    }
}
