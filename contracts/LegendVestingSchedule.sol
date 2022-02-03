// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./IVestingSchedule.sol";

/**
 * @title LegendVestingSchedule
 * @dev Implementation of the {IVestingSchedule} interface for the LEGEND tokenomics
 */
contract LegendVestingSchedule is IVestingSchedule {
    /**
     * @dev Thrown when the given schedule id is not within the range of valid identifiers
     * @param given Schedule id that triggered this error
     * @param min Min valid schedule id
     * @param max Max valid schedule id
     */
    error InvalidSchedule(uint8 given, uint8 min, uint8 max);

    /**
     * Identifiers of vesting periods according to tokenomics
     */
    uint8 public constant SCHEDULE_SEED = 0;
    uint8 public constant SCHEDULE_STRATEGIC = 1;
    uint8 public constant SCHEDULE_PRIVATE = 2;
    uint8 public constant SCHEDULE_PUBLIC = 3;
    uint8 public constant SCHEDULE_TEAM = 4;
    uint8 public constant SCHEDULE_MARKETING = 5;
    uint8 public constant SCHEDULE_LIQUIDITY = 6;
    uint8 public constant SCHEDULE_ECOSYSTEM = 7;
    uint8 public constant SCHEDULE_REWARDS = 8;
    uint8 public constant SCHEDULE_RESERVE = 9;
    
    /**
     * Constants with the value in seconds of different vesting durations
     */
    uint64 private constant DURATION_ZERO = 0; // no vesting
    uint64 private constant DURATION_04_MO = 10368000; // 4 * 30 * 24 * 3600 seconds
    uint64 private constant DURATION_08_MO = 20736000; // 8 * 30 * 24 * 3600 seconds
    uint64 private constant DURATION_10_MO = 25920000; // 10 * 30 * 24 * 3600 seconds
    uint64 private constant DURATION_12_MO = 31104000; // 12 * 30 * 24 * 3600 seconds
    uint64 private constant DURATION_24_MO = 62208000; // 24 * 30 * 24 * 3600 seconds
    uint64 private constant DURATION_36_MO = 93312000; // 36 * 30 * 24 * 3600 seconds

    /**
     * @dev Get the duration of a given vesting schedule
     * @param scheduleId Id of the schedule
     */
    function getDuration(uint8 scheduleId) public pure returns (uint64) {
        if (scheduleId == SCHEDULE_SEED) {
            return DURATION_12_MO;

        } else if (scheduleId == SCHEDULE_STRATEGIC) {
            return DURATION_10_MO;

        } else if (scheduleId == SCHEDULE_PRIVATE) {
            return DURATION_08_MO;

        } else if (scheduleId == SCHEDULE_PUBLIC) {
            return DURATION_04_MO;

        } else if (scheduleId == SCHEDULE_TEAM) {
            return DURATION_24_MO;

        } else if (scheduleId == SCHEDULE_MARKETING) {
            return DURATION_36_MO;

        } else if (scheduleId == SCHEDULE_LIQUIDITY) {
            return DURATION_ZERO;

        } else if (scheduleId == SCHEDULE_ECOSYSTEM) {
            return DURATION_36_MO;

        } else if (scheduleId == SCHEDULE_REWARDS) {
            return DURATION_24_MO;

        } else if (scheduleId == SCHEDULE_RESERVE) {
            return DURATION_24_MO;

        } else {
            revert InvalidSchedule({given: scheduleId, min: SCHEDULE_SEED, max: SCHEDULE_RESERVE});

        }
    }
}
