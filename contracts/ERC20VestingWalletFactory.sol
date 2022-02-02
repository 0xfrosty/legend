// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./ERC20VestingWallet.sol";
import "./IVestingSchedule.sol";

/**
 * @title ERC20VestingWalletFactory
 * @dev Factory for the creation of wallets {ERC20VestingWallet} that follow a schedule which implements the
 * {IVestingSchedule} interface.
 *
 * The first created wallet deploys an {ERC20VestingWallet} implementation contract. Subsequent wallets actually
 * deploy a clone (minimal proxy) that calls the implementation contract. In this way, we achieve significant gas
 * savings.
 *
 * The vesting period starts at the same time for all wallets. However, wallets may have different durations
 * depending on the schedule which is given by the {IVestingSchedule} contract. Any given beneficiary may have
 * multiple vesting wallets, provided that they don't refer to the same schedule.
 *
 * The owner of the contract is the only one who can create vesting wallets for beneficiaries. Afterwards,
 * beneficiaries themselves can claim their vested tokens through their vesting wallets.
 */
contract ERC20VestingWalletFactory is Ownable {
    using Address for address;

    /**
     * @dev Thrown if creating deplicate wallet for same beneficiary and schedule
     * @param beneficiary Address of beneficiary
     * @param scheduleId Schedule identifier
     */
    error ExistingWallet(address beneficiary, uint8 scheduleId);

    /**
     * @dev Emitted when contract owner creates a vesting wallet for a beneficiary and a given schedule
     * @param beneficiary Address of the beneficiary who is vesting funds
     * @param scheduleId Id of the schedule that determines the vesting duration
     */
    event WalletCreated(address indexed beneficiary, uint8 indexed scheduleId);

    /**
     * State vars
     */
    uint64 private immutable _start;
    address private immutable _token;
    address private immutable _schedule;
    address private _walletImplementation;
    mapping(address => mapping(uint8 => address)) private _wallets;

    /**
     * @dev Initialize contract
     * @param tokenAddress Address of {IERC20} token which is to be vested
     * @param scheduleAddress Address of {IVestingSchedule} contract that determines the duration of vesting
     * @param startTimestamp UNIX timestamp when the vesting period starts
     */
    constructor(address tokenAddress, address scheduleAddress, uint64 startTimestamp) {
        require(tokenAddress.isContract(), "ERC20 address is not a contract");
        require(scheduleAddress.isContract(), "Schedule address is not a contract");
        _start = startTimestamp;
        _token = tokenAddress;
        _schedule = scheduleAddress;
    }

    /**
     * @dev Create vesting wallet for beneficiary according to given schedule id (owner-only)
     * @param beneficiary Address of the beneficiary who will vest funds
     * @param scheduleId Id of the schedule that determines the vesting duration
     */
    function createWallet(address beneficiary, uint8 scheduleId) external onlyOwner {
        if (_wallets[beneficiary][scheduleId] != address(0)) {
            revert ExistingWallet(beneficiary, scheduleId);
        }

        address wallet;
        if (_walletImplementation == address(0)) {
            wallet = _walletImplementation = address(new ERC20VestingWallet());
        } else {
            wallet = Clones.clone(_walletImplementation);
        }

        _wallets[beneficiary][scheduleId] = wallet;
        emit WalletCreated(beneficiary, scheduleId);
        IERC20VestingWallet(wallet).initialize(_token, beneficiary, _start, getDuration(scheduleId));
    }

    /**
     * @dev Get address of {ERC20VestingWallet} contract for the given beneficiary and schedule id
     * @param beneficiary Address of the beneficiary who is vesting funds
     * @param scheduleId Id of the schedule that determines the vesting duration
     * @return Address of vesting wallet if it exists, zero address otherwise
     */
    function getWallet(address beneficiary, uint8 scheduleId) public view returns (address) {
        return _wallets[beneficiary][scheduleId];
    }

    /**
     * @dev Get vesting duration according to the given schedule id by asking the {IVestingSchedule} implementation
     * @param scheduleId Id of the schedule that determines the vesting duration
     * @return Duration of the vesting period (seconds)
     */
    function getDuration(uint8 scheduleId) public view returns (uint64) {
        return IVestingSchedule(_schedule).getDuration(scheduleId);
    }

    /**
     * @dev Getter for the {IERC20} token address
     */
    function getToken() public view returns (address) {
        return _token;
    }

    /**
     * @dev Getter for the vesting start timestamp
     */
    function getStart() public view returns (uint256) {
        return _start;
    }
}
