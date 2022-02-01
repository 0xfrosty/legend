import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber, BigNumberish } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { travelToFuture } from "./helpers/time";
import { ZERO_ADDRESS } from "./helpers/constants";
import { ERC20VestingWalletFactory } from "../typechain/ERC20VestingWalletFactory";
import { LegendToken } from "../typechain/LegendToken";

/**
 * Test factory of vesting wallets for ERC20 tokens
 */
describe("ERC20VestingWalletFactory", function () {
  let legendToken: LegendToken;
  let factory: ERC20VestingWalletFactory;
  let owner: SignerWithAddress, bob: SignerWithAddress, alice: SignerWithAddress;
  let now: number, start: number;
  const offset = 1000;

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

    const VestingWalletFactory = await ethers.getContractFactory("ERC20VestingWalletFactory");
    factory = (await VestingWalletFactory.deploy(legendToken.address, start)) as ERC20VestingWalletFactory;
    await factory.deployed();
  });

  /**
   * Check cannot initialize factory for non-contract ERC20 address
   */
  it("should revert if token address isn't contract", async function () {
    const VestingWalletFactory = await ethers.getContractFactory("ERC20VestingWalletFactory");
    // TODO: not awaiting here to work around
    // https://github.com/EthWorks/Waffle/issues/95
    expect(VestingWalletFactory.deploy(bob.address, start))
      .to.be.revertedWith("ERC20 address is not a contract");
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
    const tranches: Record<string, number> = {
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

    it("non-owner shouldn't create a wallet", async function () {
      const beneficiary = alice.address;
      const tranche = tranches.PUBLIC;

      // TODO: not awaiting here to work around
      // https://github.com/EthWorks/Waffle/issues/95
      expect(factory.connect(bob).createWallet(beneficiary, tranche))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("owner should create a wallet for a beneficiary and any tranche", async function () {
      const beneficiary = bob.address;
      const trancheValues = Object.values(tranches);
      const wallets = new Set();

      trancheValues.forEach(async function (tranche, _) {
        await factory.createWallet(beneficiary, tranche);

        const wallet = await factory.getWallet(beneficiary, tranche);
        expect(wallet).to.not.equal(ZERO_ADDRESS);
        expect(wallets).to.not.include(wallet);

        wallets.add(wallet);
      });
    });

    it("owner should create a wallet for a tranche and any beneficiary", async function () {
      const beneficiaries = [bob.address, alice.address];
      const tranche = tranches.PUBLIC;
      const wallets = new Set();

      beneficiaries.forEach(async function (beneficiary, _) {
        await factory.createWallet(beneficiary, tranche);

        const wallet = await factory.getWallet(beneficiary, tranche);
        expect(wallet).to.not.equal(ZERO_ADDRESS);
        expect(wallets).to.not.include(wallet);

        wallets.add(wallet);
      });
    });

    it("owner should create a wallet for theirselves", async function () {
      const beneficiary = owner.address;
      const tranche = tranches.PUBLIC;
      await factory.createWallet(beneficiary, tranche);

      const wallet = await factory.getWallet(beneficiary, tranche);
      expect(wallet).to.not.equal(ZERO_ADDRESS);
    });
  });
});
