# LEGEND token

This project contains the smart contracts for the LEGEND ERC20 token, written in Solidity with the help of the
[OpenZeppelin Contracts](https://openzeppelin.com/contracts/) library. The project uses [Hardhat](https://hardhat.org/)
with Typescript for scripts and tests.

The following `package.json` scripts are available:

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

| Mainnet  | Address                                    |
|----------|--------------------------------------------|
| Ethereum | 0xB8f36397e244ced60d115Add360FF0bFAA75E60f |
| Polygon  | 0xcC60c7c0Cf827355BB9FdC6d1F26f2fEE8aBc26d |

| Testnet  | Address                                    |
|----------|--------------------------------------------|
| Goerli   | 0x4331555CF00DF056dDCE67149F2236B2C417bC02 |
| Mumbai   | 0xA7d38579e0Ff4E3416D03501d19Cebf8633daBB1 |

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
