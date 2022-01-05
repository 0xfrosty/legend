import { expect } from "chai";
import { ethers } from "hardhat";

import { LegendToken } from "../typechain/LegendToken";

describe("LegendToken", function () {
  let legendToken: LegendToken;

  const name = "Legend";
  const symbol = "LEGEND";
  const decimals = 18;

  beforeEach(async function () {
    const LegendTokenFactory = await ethers.getContractFactory("LegendToken");
    legendToken = (await LegendTokenFactory.deploy()) as LegendToken;
    await legendToken.deployed();
  });
  
  it(`should have the ${name} name`, async function () {
    expect(await legendToken.name()).to.equal(name);
  });

  it(`should have the ${symbol} symbol`, async function () {
    expect(await legendToken.symbol()).to.equal(symbol);
  });

  it(`should have ${decimals} decimals`, async function () {
    expect(await legendToken.decimals()).to.equal(decimals);
  });
});
