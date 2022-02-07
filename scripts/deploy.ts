/* eslint-disable prettier/prettier */
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import * as fs from "fs";
import * as path from "path";
import { ethers } from "hardhat";
import { parse, Parser } from "csv-parse";
import { BigNumber } from "ethers";
import { ERC20VestingWalletFactory } from "../typechain/ERC20VestingWalletFactory";
import { IERC20 } from "../typechain/IERC20";
import { IVestingSchedule } from "../typechain/IVestingSchedule";
import { LegendToken } from "../typechain/LegendToken";
import { LegendVestingSchedule } from "../typechain/LegendVestingSchedule";

enum Round {
  Seed = "0",
  Strategic = "1",
  Private = "2",
  Public = "3"
};

type Beneficiary = {
  address: string;
  allocation: string;
  round: Round;
};

async function deployLegendToken(): Promise<LegendToken> {
  const LegendTokenContractFactory = await ethers.getContractFactory("LegendToken");
  const token = await LegendTokenContractFactory.deploy();

  return await token.deployed();
}

async function deployLegendVestingSchedule(): Promise<LegendVestingSchedule> {
  const LegendVestingScheduleContractFactory = await ethers.getContractFactory("LegendVestingSchedule");
  const schedule = await LegendVestingScheduleContractFactory.deploy();

  return await schedule.deployed();
}

async function deployVestingScheduleFactory(
  token: IERC20,
  schedule: IVestingSchedule,
  start: number
): Promise<ERC20VestingWalletFactory> {
  const VestingWalletFactoryContractFactory = await ethers.getContractFactory("ERC20VestingWalletFactory");
  const deployPromise = VestingWalletFactoryContractFactory.deploy(token.address, schedule.address, start);
  const factory = (await deployPromise) as ERC20VestingWalletFactory;

  return await factory.deployed();
}

function getUnlocked(total: BigNumber, round: Round): BigNumber {
  switch (round) {
    case Round.Seed:
      return total.mul(10).div(100);

    case Round.Strategic:
      return total.mul(15).div(100);

    case Round.Private:
      return total.mul(15).div(100);

    case Round.Public:
      return total.mul(20).div(100);

    default:
      throw new Error(`Invalid round id: ${round}`);
  }
}

async function distributeFunds(bene: Beneficiary, token: IERC20, walletFactory: ERC20VestingWalletFactory) {
  const alloc = ethers.utils.parseUnits(bene.allocation);
  const unlocked = getUnlocked(alloc, bene.round);
  await token.transfer(bene.address, unlocked);
  console.log(`Unlocked ${ethers.utils.formatUnits(unlocked)} LEGENDs for ${bene.address}`);

  const locked = alloc.sub(unlocked);
  await walletFactory.createWallet(bene.address, bene.round);
  const walletAddress = await walletFactory.getWallet(bene.address, bene.round);
  await token.transfer(walletAddress, locked);
  console.log(`Locked ${ethers.utils.formatUnits(locked)} LEGENDs for ${bene.address} at ${walletAddress}`);
}

function beneficiariesCSVParser(): Parser {
  const csvFilePath = path.resolve(__dirname, 'data/beneficiaries.csv');
  return fs
    .createReadStream(csvFilePath)
    .pipe(parse({ columns: true }));
}

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const LAUNCH_TIMESTAMP = 1644235200; // 2022/02/02 13:00:00 UTC
  const VESTING_START = LAUNCH_TIMESTAMP + 600;

  const token = await deployLegendToken();
  console.log("LegendToken deployed to:", token.address);

  const schedule = await deployLegendVestingSchedule();
  console.log("LegendVestingSchedule deployed to:", schedule.address);

  const walletFactory = await deployVestingScheduleFactory(token, schedule, VESTING_START);
  console.log("ERC20VestingWalletFactory deployed to:", walletFactory.address);

  // eslint-disable-next-line node/no-unsupported-features/es-syntax
  for await (const bene of beneficiariesCSVParser()) {
    await distributeFunds(bene, token, walletFactory);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
