// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./IERC20VestingWallet.sol";
import "./ERC20VestingWallet.sol";

contract ERC20VestingWalletFactory is Ownable {
    using Address for address;
    
    enum Tranche { Seed, Strategic, Private, Public, Team, Marketing, Liquidity, Ecosystem, Rewards, Reserve }

    error InvalidTranche();

    uint64 private constant DURATION_ZERO = 0; // no vesting
    uint64 private constant DURATION_04_MO = 10368000; // 4 * 30 * 24 * 3600 seconds
    uint64 private constant DURATION_08_MO = 20736000; // 8 * 30 * 24 * 3600 seconds
    uint64 private constant DURATION_10_MO = 25920000; // 10 * 30 * 24 * 3600 seconds
    uint64 private constant DURATION_12_MO = 31104000; // 12 * 30 * 24 * 3600 seconds
    uint64 private constant DURATION_24_MO = 62208000; // 24 * 30 * 24 * 3600 seconds
    uint64 private constant DURATION_36_MO = 93312000; // 36 * 30 * 24 * 3600 seconds

    address private immutable _token;
    address private immutable _walletImplementation;
    uint64 private _start;
    mapping(address => mapping(Tranche => address)) private _wallets;

    modifier validTranche(Tranche tranche) {
        if (tranche > type(Tranche).max || tranche <  type(Tranche).min) {
            revert InvalidTranche();
        }
        _;
    }

    constructor(address tokenAddress, uint64 startTimestamp) {
        require(tokenAddress.isContract(), "ERC20 address is not a contract");
        _start = startTimestamp;
        _token = tokenAddress;
        _walletImplementation = address(new ERC20VestingWallet());
    }

    function getStart() public view virtual returns (uint256) {
        return _start;
    }

    function getDuration(Tranche tranche) public pure validTranche(tranche) virtual returns (uint256) {
        return _getDurationByTranche(tranche);
    }

    function getWallet(
        address beneficiary,
        Tranche tranche
    )
        public
        view
        validTranche(tranche)
        virtual
        returns (address)
    {
        return _wallets[beneficiary][tranche];
    }

    function createWallet(
        address beneficiary,
        Tranche tranche
    )
        external
        onlyOwner
        validTranche(tranche)
        virtual
        returns (address)
    {
        address wallet = Clones.clone(_walletImplementation);
        IERC20VestingWallet(wallet).initialize(_token, beneficiary, _start, _getDurationByTranche(tranche));
        return wallet;
    }

    function _getDurationByTranche(Tranche tranche) internal pure returns (uint64) {
        if (tranche == Tranche.Seed) {
            return DURATION_12_MO;
        
        } else if (tranche == Tranche.Strategic) {
            return DURATION_10_MO;
        
        } else if (tranche == Tranche.Private) {
            return DURATION_08_MO;
        
        } else if (tranche == Tranche.Public) {
            return DURATION_04_MO;
        
        } else if (tranche == Tranche.Team) {
            return DURATION_24_MO;
        
        } else if (tranche == Tranche.Marketing) {
            return DURATION_36_MO;
        
        } else if (tranche == Tranche.Liquidity) {
            return DURATION_ZERO;
        
        } else if (tranche == Tranche.Ecosystem) {
            return DURATION_36_MO;
        
        } else if (tranche == Tranche.Rewards) {
            return DURATION_24_MO;
        
        } else if (tranche == Tranche.Reserve) {
            return DURATION_24_MO;
        
        } else {
            revert InvalidTranche();
        
        }
    }
}
