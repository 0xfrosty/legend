import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ZERO_ADDRESS } from "./helpers/constants";
import { ERC20VestingWalletFactory } from "../typechain/ERC20VestingWalletFactory";
import { LegendToken } from "../typechain/LegendToken";
import { LegendVestingSchedule } from "../typechain/LegendVestingSchedule";

/**
 * Test factory of vesting wallets for ERC20 tokens
 */
describe("ERC20VestingWalletFactory", function () {
  let legendToken: LegendToken;
  let schedule: LegendVestingSchedule;
  let factory: ERC20VestingWalletFactory;
  let owner: SignerWithAddress, bob: SignerWithAddress, alice: SignerWithAddress;
  let now: number, start: number;
  const offset = 1000;
  const schedules: Record<string, number> = {
    SEED: 0,
    STRATEGIC: 1,
    PRIVATE: 2,
    PUBLIC: 3,
    TEAM: 4,
    MARKETING: 5,
    LIQUIDITY: 6,
    ECOSYSTEM: 7,
    REWARDS: 8,
    RESERVE: 9,
  };

  /**
   * Deploy contracts before each test
   */
  beforeEach(async function () {
    [owner, bob, alice] = await ethers.getSigners();
    const block = await ethers.provider.getBlock("latest");
    now = block.timestamp;
    start = now + offset;

    const LegendTokenFactory = await ethers.getContractFactory("LegendToken");
    legendToken = (await LegendTokenFactory.deploy()) as LegendToken;
    await legendToken.deployed();

    const LegendVestingScheduleFactory = await ethers.getContractFactory("LegendVestingSchedule");
    schedule = (await LegendVestingScheduleFactory.deploy()) as LegendVestingSchedule;
    await schedule.deployed();

    const VestingWalletFactory = await ethers.getContractFactory("ERC20VestingWalletFactory");
    const deployFactory = VestingWalletFactory.deploy(legendToken.address, schedule.address, start);
    factory = (await deployFactory) as ERC20VestingWalletFactory;
    await factory.deployed();
  });

  /**
   * Check cannot initialize factory for non-contract ERC20 address
   */
  it("should revert if token address isn't contract", async function () {
    const VestingWalletFactory = await ethers.getContractFactory("ERC20VestingWalletFactory");
    // TODO: not awaiting here to work around
    // https://github.com/EthWorks/Waffle/issues/95
    expect(VestingWalletFactory.deploy(bob.address, schedule.address, start))
      .to.be.revertedWith("ERC20 address is not a contract");
  });

  /**
   * Check cannot initialize factory for non-contract schedule address
   */
  it("should revert if schedule address isn't contract", async function () {
    const VestingWalletFactory = await ethers.getContractFactory("ERC20VestingWalletFactory");
    // TODO: not awaiting here to work around
    // https://github.com/EthWorks/Waffle/issues/95
    expect(VestingWalletFactory.deploy(legendToken.address, bob.address, start))
      .to.be.revertedWith("Schedule address is not a contract");
  });

  /**
   * Check contract tracks the proper token and start timestamp
   */
  it("should have the right token", async function () {
    expect(await factory.getToken()).to.equal(legendToken.address);
  });

  it("should start at the right timestamp", async function () {
    expect(await factory.getStart()).to.equal(start);
  });

  /**
   * Check factory can manage vesting wallets
   */
  describe("Wallet Management", function () {
    it("non-owner shouldn't create a wallet", async function () {
      const beneficiary = alice.address;
      const schedule = schedules.PUBLIC;

      // TODO: not awaiting here to work around
      // https://github.com/EthWorks/Waffle/issues/95
      expect(factory.connect(bob).createWallet(beneficiary, schedule))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("owner should create a wallet for a beneficiary and any schedule", async function () {
      const beneficiary = bob.address;
      const scheduleIds = Object.values(schedules);
      const wallets = new Set();

      scheduleIds.forEach(async function (schedule, _) {
        expect(await factory.createWallet(beneficiary, schedule))
          .to.emit(factory, "WalletCreated")
          .withArgs(beneficiary, schedule);

        const wallet = await factory.getWallet(beneficiary, schedule);
        expect(wallet).to.not.equal(ZERO_ADDRESS);
        expect(wallets).to.not.include(wallet);

        wallets.add(wallet);
      });
    });

    it("owner should create a wallet for a schedule and any beneficiary", async function () {
      const beneficiaries = [bob.address, alice.address];
      const schedule = schedules.PUBLIC;
      const wallets = new Set();

      beneficiaries.forEach(async function (beneficiary, _) {
        expect(await factory.createWallet(beneficiary, schedule))
          .to.emit(factory, "WalletCreated")
          .withArgs(beneficiary, schedule);

        const wallet = await factory.getWallet(beneficiary, schedule);
        expect(wallet).to.not.equal(ZERO_ADDRESS);
        expect(wallets).to.not.include(wallet);

        wallets.add(wallet);
      });
    });

    it("owner should create a wallet for theirselves", async function () {
      const beneficiary = owner.address;
      const schedule = schedules.PUBLIC;
      expect(await factory.createWallet(beneficiary, schedule))
        .to.emit(factory, "WalletCreated")
        .withArgs(beneficiary, schedule);

      const wallet = await factory.getWallet(beneficiary, schedule);
      expect(wallet).to.not.equal(ZERO_ADDRESS);
    });

    it("shouldn't create a wallet twice for same beneficiary and schedule", async function () {
      const beneficiary = bob.address;
      const schedule = schedules.PUBLIC;
      await factory.createWallet(beneficiary, schedule);
      expect(factory.createWallet(beneficiary, schedule))
        .to.be.revertedWith(`ExistingWallet("${beneficiary}", ${schedule})`);
    });

    it("anyone should get the wallet address of anyone", async function () {
      const requester = bob;
      const beneficiary = alice.address;
      const schedule = schedules.PUBLIC;
      await factory.createWallet(beneficiary, schedule);

      const wallet = await factory.connect(requester).getWallet(beneficiary, schedule);
      expect(wallet).to.not.equal(ZERO_ADDRESS);
    });

    it("should get zero as wallet address if it wasn't created", async function () {
      const beneficiary = alice.address;
      const schedule = schedules.PUBLIC;

      const wallet = await factory.getWallet(beneficiary, schedule);
      expect(wallet).to.equal(ZERO_ADDRESS);
    });
  });

  /**
   * Check factory can manage vesting wallets
   */
  describe("Vesting Schedule", function () {
    async function getVestingDuration(beneficiary: string, schedule: number) {
      await factory.createWallet(beneficiary, schedule);
      const walletAddress = await factory.getWallet(beneficiary, schedule);

      const VestingWalletFactory = await ethers.getContractFactory("ERC20VestingWallet");
      const wallet = VestingWalletFactory.attach(walletAddress);
      return await wallet.getDuration();
    }

    it("seed beneficiary should vest for 12 months", async function () {
      const expectedDuration = 12 * 30 * 24 * 3600;
      expect(await getVestingDuration(bob.address, schedules.SEED))
        .to.equal(expectedDuration);
    });

    it("strategic beneficiary should vest for 10 months", async function () {
      const expectedDuration = 10 * 30 * 24 * 3600;
      expect(await getVestingDuration(bob.address, schedules.STRATEGIC))
        .to.equal(expectedDuration);
    });

    it("private beneficiary should vest for 8 months", async function () {
      const expectedDuration = 8 * 30 * 24 * 3600;
      expect(await getVestingDuration(bob.address, schedules.PRIVATE))
        .to.equal(expectedDuration);
    });

    it("public beneficiary should vest for 4 months", async function () {
      const expectedDuration = 4 * 30 * 24 * 3600;
      expect(await getVestingDuration(bob.address, schedules.PUBLIC))
        .to.equal(expectedDuration);
    });

    it("team beneficiary should vest for 2 years", async function () {
      const expectedDuration = 24 * 30 * 24 * 3600;
      expect(await getVestingDuration(bob.address, schedules.TEAM))
        .to.equal(expectedDuration);
    });

    it("marketing beneficiary should vest for 3 years", async function () {
      const expectedDuration = 36 * 30 * 24 * 3600;
      expect(await getVestingDuration(bob.address, schedules.MARKETING))
        .to.equal(expectedDuration);
    });

    it("liquidity beneficiary should not vest", async function () {
      const expectedDuration = 0;
      expect(await getVestingDuration(bob.address, schedules.LIQUIDITY))
        .to.equal(expectedDuration);
    });

    it("ecosystem beneficiary should vest for 3 years", async function () {
      const expectedDuration = 36 * 30 * 24 * 3600;
      expect(await getVestingDuration(bob.address, schedules.ECOSYSTEM))
        .to.equal(expectedDuration);
    });

    it("rewards beneficiary should vest for 2 years", async function () {
      const expectedDuration = 24 * 30 * 24 * 3600;
      expect(await getVestingDuration(bob.address, schedules.REWARDS))
        .to.equal(expectedDuration);
    });

    it("reserve beneficiary should vest for 2 years", async function () {
      const expectedDuration = 24 * 30 * 24 * 3600;
      expect(await getVestingDuration(bob.address, schedules.RESERVE))
        .to.equal(expectedDuration);
    });

    it("unknown schedule should revert", async function () {
      const invalidSchedule = 255;
      const expectedError = `InvalidSchedule(${invalidSchedule}, ${schedules.SEED}, ${schedules.RESERVE})`;
      // TODO: not awaiting here to work around
      // https://github.com/EthWorks/Waffle/issues/95
      expect(getVestingDuration(bob.address, invalidSchedule))
        .to.be.revertedWith(expectedError);
    });
  });
});
