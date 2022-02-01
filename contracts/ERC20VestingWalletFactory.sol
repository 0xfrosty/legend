// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./IERC20VestingWallet.sol";
import "./IVestingSchedule.sol";
import "./ERC20VestingWallet.sol";

contract ERC20VestingWalletFactory is Ownable {
    using Address for address;

    error ExistingWallet(address beneficiary, uint8 scheduleId);

    event WalletCreated(address indexed beneficiary, uint8 indexed scheduleId);

    uint64 private immutable _start;
    address private immutable _token;
    address private immutable _schedule;
    address private _walletImplementation;
    mapping(address => mapping(uint8 => address)) private _wallets;

    constructor(address tokenAddress, address scheduleAddress, uint64 startTimestamp) {
        require(tokenAddress.isContract(), "ERC20 address is not a contract");
        require(scheduleAddress.isContract(), "Schedule address is not a contract");
        _start = startTimestamp;
        _token = tokenAddress;
        _schedule = scheduleAddress;
    }

    function getToken() public view virtual returns (address) {
        return _token;
    }

    function getStart() public view virtual returns (uint256) {
        return _start;
    }

    function getDuration(uint8 scheduleId) public view virtual returns (uint64) {
        return IVestingSchedule(_schedule).getDuration(scheduleId);
    }

    function getWallet(address beneficiary, uint8 scheduleId) public view virtual returns (address) {
        return _wallets[beneficiary][scheduleId];
    }

    function createWallet(address beneficiary, uint8 scheduleId) external onlyOwner virtual {
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
}
