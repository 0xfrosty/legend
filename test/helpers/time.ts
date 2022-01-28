import { ethers } from "hardhat";

async function travelToFuture(timestamp: number) {
  const block = await ethers.provider.getBlock("latest");
  if (timestamp > block.timestamp) {
    await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp]);
  }
}

export { travelToFuture };
