// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./IVestingSchedule.sol";

contract LegendVestingSchedule is IVestingSchedule {
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
    
    uint64 private constant DURATION_ZERO = 0; // no vesting
    uint64 private constant DURATION_04_MO = 10368000; // 4 * 30 * 24 * 3600 seconds
    uint64 private constant DURATION_08_MO = 20736000; // 8 * 30 * 24 * 3600 seconds
    uint64 private constant DURATION_10_MO = 25920000; // 10 * 30 * 24 * 3600 seconds
    uint64 private constant DURATION_12_MO = 31104000; // 12 * 30 * 24 * 3600 seconds
    uint64 private constant DURATION_24_MO = 62208000; // 24 * 30 * 24 * 3600 seconds
    uint64 private constant DURATION_36_MO = 93312000; // 36 * 30 * 24 * 3600 seconds

    function getDuration(uint8 scheduleId) public pure virtual returns (uint64) {
        return _getDurationBySchedule(scheduleId);
    }


    function _getDurationBySchedule(uint8 scheduleId) internal pure returns (uint64) {
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
