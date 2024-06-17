import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { LegendToken } from "../typechain/LegendToken";

/**
 * Test LEGEND token
 */
describe("LegendToken", function () {
  let legendToken: LegendToken;
  let owner: SignerWithAddress, bob: SignerWithAddress;

  const name = "Legend";
  const symbol = "LEGEND";
  const decimals = 18;
  const totalTokens = "1000000000";
  const totalSupply = ethers.utils.parseUnits(totalTokens, decimals);

  /**
   * Deploy contract before each test
   */
  beforeEach(async function () {
    const LegendTokenFactory = await ethers.getContractFactory("LegendToken");
    legendToken = (await LegendTokenFactory.deploy()) as LegendToken;
    await legendToken.deployed();

    [owner, bob] = await ethers.getSigners();
  });

  /**
   * Check contract tracks the proper values (name, symbol, decimals, supply)
   */
  it(`should have the ${name} name`, async function () {
    expect(await legendToken.name()).to.equal(name);
  });

  it(`should have the ${symbol} symbol`, async function () {
    expect(await legendToken.symbol()).to.equal(symbol);
  });

  it(`should have ${decimals} decimals`, async function () {
    expect(await legendToken.decimals()).to.equal(decimals);
  });

  it(`should have minted ${totalTokens} tokens`, async function () {
    expect(await legendToken.totalSupply()).to.equal(totalSupply);
  });

  /**
   * Check LEGEND transfers work as expected.
   */
  describe("Transfers", function () {
    it("should allow owner to pause transfers", async function () {
      expect(await legendToken.pause())
        .to.emit(legendToken, "Paused")
        .withArgs(owner.address);

      expect(await legendToken.paused()).to.true;
    });

    it("should allow owner to resume transfers", async function () {
      await legendToken.pause();

      expect(await legendToken.unpause())
        .to.emit(legendToken, "Unpaused")
        .withArgs(owner.address);

      expect(await legendToken.paused()).to.false;
    });

    it("should allow owner to renounce ownership", async function () {
      expect(await legendToken.renounceOwnership())
        .to.emit(legendToken, "OwnershipTransferred")
        .withArgs(owner.address);
    });

    it("shouldn't allow non-owner to pause transfers", async function () {
      // not awaiting here to work around
      // https://github.com/EthWorks/Waffle/issues/95
      expect(legendToken.connect(bob).pause())
        .to.be.revertedWith("Ownable: caller is not the owner");

      expect(await legendToken.paused()).to.false;
    });

    it("should allow holder to transfer tokens", async function () {
      const amount = ethers.utils.parseUnits("100", decimals);
      const ownerBalance = await legendToken.balanceOf(owner.address);
      const bobBalance = await legendToken.balanceOf(bob.address);
      const newOwnerBalance = ownerBalance.sub(amount);
      const newBobBalance = bobBalance.add(amount);

      expect(await legendToken.transfer(bob.address, amount))
        .to.emit(legendToken, "Transfer")
        .withArgs(owner.address, bob.address, amount);

      expect(await legendToken.balanceOf(owner.address)).to.equal(newOwnerBalance);
      expect(await legendToken.balanceOf(bob.address)).to.equal(newBobBalance);
    });

    it("should allow holder to transfer tokens after no owner", async function () {
      await legendToken.renounceOwnership();

      const amount = ethers.utils.parseUnits("100", decimals);
      const ownerBalance = await legendToken.balanceOf(owner.address);
      const bobBalance = await legendToken.balanceOf(bob.address);
      const newOwnerBalance = ownerBalance.sub(amount);
      const newBobBalance = bobBalance.add(amount);

      expect(await legendToken.transfer(bob.address, amount))
        .to.emit(legendToken, "Transfer")
        .withArgs(owner.address, bob.address, amount);

      expect(await legendToken.balanceOf(owner.address)).to.equal(newOwnerBalance);
      expect(await legendToken.balanceOf(bob.address)).to.equal(newBobBalance);
    });

    it("shouldn't allow holder to transfer tokens when contract is paused", async function () {
      const amount = ethers.utils.parseUnits("100", decimals);

      await legendToken.pause();
      // not awaiting here to work around
      // https://github.com/EthWorks/Waffle/issues/95
      expect(legendToken.transfer(bob.address, amount))
        .to.be.revertedWith("Pausable: paused");
    });
  });
});
