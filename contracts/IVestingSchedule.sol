// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title IVestingSchedule
 * @dev Interface for contracts that define the duration of vesting periods according to different schedules. E.g.
 * a schedule might refer to a seed round, while other could refer to a public sale - and the vesting duration could
 * be different in each case.
 */
interface IVestingSchedule {
    /**
     * @dev Get the duration of a given vesting schedule
     * @param scheduleId Id of the schedule
     */
    function getDuration(uint8 scheduleId) external view returns (uint64);
}
