// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IVestingSchedule {
    error InvalidSchedule(uint8 given, uint8 min, uint8 max);

    function getDuration(uint8 scheduleId) external pure returns (uint64);
}
