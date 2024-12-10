# LEGEND token

This project contains the smart contracts for the LEGEND ERC20 token, written in Solidity with the help of the
[OpenZeppelin Contracts](https://openzeppelin.com/contracts/) library. The project uses [Hardhat](https://hardhat.org/)
with Typescript for scripts and tests.

Use **Node 20**. The following `package.json` scripts are available:

```shell
yarn clean
yarn compile
yarn coverage
yarn deploy:local
yarn local
yarn test
```

You can also try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.ts
TS_NODE_FILES=true npx ts-node scripts/deploy.ts
npx eslint '**/*.{js,ts}'
npx eslint '**/*.{js,ts}' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```

## Contract addresses

LEGEND's home chain is Ethereum. Smart contract is mapped onto other networks and funds are bridged in order to provide
liquidity.

### Mainnet

| Ethereum                                   | Polygon                                    |
|--------------------------------------------|--------------------------------------------|
| 0x1B1FF83AE0751ffb7ce0224e9C330e859E95dD16 | 0x4BDeD3d44f716fE6139250dB8eb8366bAA8f3992 |

| Base                                       |
|--------------------------------------------|
| 0xc7837BE3d71E00fcbE76D77602BCf353Df859664 |

### Testnet

| Goerli                                     | Mumbai                                     |
|--------------------------------------------|--------------------------------------------|
| 0x4331555CF00DF056dDCE67149F2236B2C417bC02 | 0xA7d38579e0Ff4E3416D03501d19Cebf8633daBB1 |

| Sepolia                                    | Amoy                                       |
|--------------------------------------------|--------------------------------------------|
| 0x4331555CF00DF056dDCE67149F2236B2C417bC02 | 0x8b377fdAcb6D5Bd4d13707fB7b9a2D523A4Afdf4 |

| Base Sepolia                               | Cronos Testnet                             |
|--------------------------------------------|--------------------------------------------|
| 0x3228A48B231EefFf6F926C1754C9c43601F61E52 | 0xF35908524C9273F9C24380D506504388B8789564 |

# Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/sample-script.ts
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```

# Performance optimizations

For faster runs of your tests and scripts, consider skipping ts-node's type checking by setting the environment variable `TS_NODE_TRANSPILE_ONLY` to `1` in hardhat's environment. For more details see [the documentation](https://hardhat.org/guides/typescript.html#performance-optimizations).

# Bridging

## Base

### Deploy L2 token

[Tutorial](https://docs.optimism.io/builders/app-developers/tutorials/standard-bridge-standard-token)

Dependencies:

* cast (forge)
* jq

#### Testnet

```bash
export PRIVATE_KEY=
export RPC_URL=https://sepolia.base.org
export L1_ERC20_ADDRESS=0x4331555CF00DF056dDCE67149F2236B2C417bC02
cast send 0x4200000000000000000000000000000000000012 "createOptimismMintableERC20(address,string,string)" $L1_ERC20_ADDRESS "Legend" "LEGEND" --private-key $PRIVATE_KEY --rpc-url $RPC_URL --json | jq -r '.logs[0].topics[2]' | cast parse-bytes32-address
```

#### Mainnet

```bash
export PRIVATE_KEY=
export RPC_URL=https://mainnet.base.org
export L1_ERC20_ADDRESS=0x1B1FF83AE0751ffb7ce0224e9C330e859E95dD16
cast send 0xF10122D428B4bc8A9d050D06a2037259b4c4B83B "createOptimismMintableERC20(address,string,string)" $L1_ERC20_ADDRESS "Legend" "LEGEND" --private-key $PRIVATE_KEY --rpc-url $RPC_URL --json | jq -r '.logs[0].topics[2]' | cast parse-bytes32-address
```

### Bridge tokens from L1 to L2

[Tutorial](https://docs.optimism.io/builders/app-developers/tutorials/cross-dom-bridge-erc20)

#### Testnet

```bash
mkdir legend-base
cd legend-base
nvm use v20.18.0
pnpm init
pnpm add @eth-optimism/sdk
pnpm add ethers@^5
export PRIVATE_KEY=
node
```

```js
const optimism = require("@eth-optimism/sdk")
const ethers = require("ethers")

const privateKey = process.env.PRIVATE_KEY

const l1Provider = new ethers.providers.StaticJsonRpcProvider("https://rpc.ankr.com/eth_sepolia")
const l2Provider = new ethers.providers.StaticJsonRpcProvider("https://sepolia.base.org")
const l1Wallet = new ethers.Wallet(privateKey, l1Provider)
const l2Wallet = new ethers.Wallet(privateKey, l2Provider)

const l1Token = "0x4331555CF00DF056dDCE67149F2236B2C417bC02"
const l2Token = "0x3228A48B231EefFf6F926C1754C9c43601F61E52"
const l1ChainId = 11155111 // Sepolia
const l2ChainId = 84532    // Base Sepolia
const oneToken = 1000000000000000000n
const amount = 10000n * oneToken

const messenger = new optimism.CrossChainMessenger({
  l1ChainId,
  l2ChainId,
  l1SignerOrProvider: l1Wallet,
  l2SignerOrProvider: l2Wallet,
})

tx = await messenger.approveERC20(l1Token, l2Token, amount)
await tx.wait()

tx = await messenger.depositERC20(l1Token, l2Token, amount)
await tx.wait()

await messenger.waitForMessageStatus(tx.hash, optimism.MessageStatus.RELAYED)

const erc20ABI = [{ constant: true, inputs: [{ name: "_owner", type: "address" }], name: "balanceOf", outputs: [{ name: "balance", type: "uint256" }], type: "function" }, { inputs: [], name: "faucet", outputs: [], stateMutability: "nonpayable", type: "function" }]
const l1ERC20 = new ethers.Contract(l1Token, erc20ABI, l1Wallet)
const l2ERC20 = new ethers.Contract(l2Token, erc20ABI, l2Wallet)
console.log((await l1ERC20.balanceOf(l1Wallet.address)).toString())
console.log((await l2ERC20.balanceOf(l2Wallet.address)).toString())
```

### Superchain Token List

[Open PR](https://github.com/ethereum-optimism/ethereum-optimism.github.io#readme)
