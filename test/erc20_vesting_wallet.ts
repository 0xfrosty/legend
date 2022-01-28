import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber, BigNumberish } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { travelToFuture } from "./helpers/time";
import { ZERO_ADDRESS } from "./helpers/constants";
import { ERC20VestingWallet } from "../typechain/ERC20VestingWallet";
import { LegendToken } from "../typechain/LegendToken";

/**
 * Test vesting wallet for ERC20 tokens
 */
describe("ERC20VestingWallet", function () {
  let legendToken: LegendToken;
  let vestingWallet: ERC20VestingWallet;
  let owner: SignerWithAddress, bob: SignerWithAddress;
  let now: number, start: number, end: number;
  const offset = 1000;
  const duration = 1000;

  /**
   * Deploy contracts before each test
   */
  beforeEach(async function () {
    [owner, bob] = await ethers.getSigners();
    const block = await ethers.provider.getBlock("latest");
    now = block.timestamp;
    start = now + offset;
    end = start + duration;

    const LegendTokenFactory = await ethers.getContractFactory("LegendToken");
    legendToken = (await LegendTokenFactory.deploy()) as LegendToken;
    await legendToken.deployed();

    const VestingWalletFactory = await ethers.getContractFactory("ERC20VestingWallet");
    const deployer = VestingWalletFactory.deploy(legendToken.address, bob.address, start, duration);
    vestingWallet = (await deployer) as ERC20VestingWallet;
    await vestingWallet.deployed();
  });

  /**
   * Check cannot create vesting contract for non-contract ERC20 address
   */
  it("should revert if token address isn't contract", async function () {
    // TODO: not awaiting here to work around
    // https://github.com/EthWorks/Waffle/issues/95
    const VestingWalletFactory = await ethers.getContractFactory("ERC20VestingWallet");
    expect(VestingWalletFactory.deploy(owner.address, bob.address, start, duration))
      .to.be.revertedWith("ERC20VestingWallet: ERC20 address is not contract");
  });

  /**
   * Check cannot create vesting contract for beneficiary zero address
   */
  it("should revert if beneficiary is zero address", async function () {
    const VestingWalletFactory = await ethers.getContractFactory("ERC20VestingWallet");
    // TODO: not awaiting here to work around
    // https://github.com/EthWorks/Waffle/issues/95
    expect(VestingWalletFactory.deploy(legendToken.address, ZERO_ADDRESS, start, duration))
      .to.be.revertedWith("ERC20VestingWallet: beneficiary is zero address");
  });

  /**
   * Check contract tracks the proper values (beneficiary, start, duration)
   */
  it("should have the right beneficiary", async function () {
    expect(await vestingWallet.beneficiary()).to.equal(bob.address);
  });

  it("should start at the right timestamp", async function () {
    expect(await vestingWallet.start()).to.equal(start);
  });

  it(`should last for ${duration} seconds`, async function () {
    expect(await vestingWallet.duration()).to.equal(duration);
  });

  /**
   * Check vesting schedule works as expected
   */
  describe("Vesting Schedule", function () {
    let legendTotalSupply: BigNumber;

    /**
     * Owner transfers LEGEND supply to Bob's vesting wallet before each test
     */
    beforeEach(async function () {
      legendTotalSupply = await legendToken.totalSupply();
      await legendToken.transfer(vestingWallet.address, legendTotalSupply);
    });

    /**
     * Check that some amount is released when the beneficiary claims their funds at a given timestamp
     * @param claimTimestamp Unix time in which the claim is made
     * @param expectedAmount Expected tokenbits that have been released in total for the beneficiary
     */
    async function checkVesting(claimTimestamp: number, expectedAmount: BigNumberish) {
      expectedAmount = BigNumber.from(expectedAmount);
      const previouslyReleased = await vestingWallet.released();
      const expectedReleased = expectedAmount.sub(previouslyReleased);

      await travelToFuture(claimTimestamp);
      expect(await vestingWallet.connect(bob).release())
        .to.emit(vestingWallet, "ERC20Released")
        .withArgs(legendToken.address, expectedReleased);

      expect(await legendToken.balanceOf(bob.address)).to.equal(expectedAmount);
    }

    /**
     * Test beneficiaries release funds based on linear schedule
     */
    it("beneficiary should release 0 tokens before start", async function () {
      const claimTimestamp = now;
      const expectedAmount = 0;
      await checkVesting(claimTimestamp, expectedAmount);
    });

    it("beneficiary should release 0 tokens right at start", async function () {
      const claimTimestamp = start;
      const expectedAmount = 0;
      await checkVesting(claimTimestamp, expectedAmount);
    });

    it("beneficiary should release 25% of tokens at 1/4 of vesting schedule", async function () {
      const claimTimestamp = start + (duration / 4);
      const expectedAmount = legendTotalSupply.div(4);
      await checkVesting(claimTimestamp, expectedAmount);
    });

    it("beneficiary should release 50% of tokens at 1/2 of vesting schedule", async function () {
      const claimTimestamp = start + (duration / 2);
      const expectedAmount = legendTotalSupply.div(2);
      await checkVesting(claimTimestamp, expectedAmount);
    });

    it("beneficiary should release 75% of tokens at 3/4 of vesting schedule", async function () {
      const claimTimestamp = start + (duration * 3 / 4);
      const expectedAmount = legendTotalSupply.mul(3).div(4);
      await checkVesting(claimTimestamp, expectedAmount);
    });

    it("beneficiary should release all tokens right at end", async function () {
      const claimTimestamp = end;
      const expectedAmount = legendTotalSupply;
      await checkVesting(claimTimestamp, expectedAmount);
    });

    it("beneficiary should release all tokens after end", async function () {
      const claimTimestamp = end + 1;
      const expectedAmount = legendTotalSupply;
      await checkVesting(claimTimestamp, expectedAmount);
    });

    it("beneficiary should release tokens over time", async function () {
      // Bob releases his funds at 1/10 of vesting schedule
      let claimTimestamp = start + (duration / 10);
      let expectedAmount = legendTotalSupply.div(10);
      await checkVesting(claimTimestamp, expectedAmount);

      // Bob releases his funds at 1/90 of vesting schedule
      claimTimestamp = start + (duration * 9 / 10);
      expectedAmount = legendTotalSupply.mul(9).div(10);
      await checkVesting(claimTimestamp, expectedAmount);
    });

    /**
     * Test non-beneficiaries cannot release funds
     */
    it("non-beneficiary shouldn't release any tokens", async function () {
      // Owner tries to release tokens after the schedule ends
      await travelToFuture(end + 1);
      await vestingWallet.release();

      // But the whole allocation is for Bob, so Owner receives nothing
      expect(await legendToken.balanceOf(owner.address)).to.equal(0);
    });
  });
});
