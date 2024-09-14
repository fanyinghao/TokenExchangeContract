# Token Exchange Contract

This project demonstrates an Upgradable ETH-USDC Exchange Contract. The contract will allow users to deposit ETH and swap it for USDC with real-time ETH prices sourced from Chainlink Functions.

Try running some of the following tasks:
```shell
npm run test
npm run deploy
```

## Environment Variables
Before deploy `TokenExchange.sol` contract, please run `npx hardhat varset VARIABLES` to set the environment variables, including below:
- `CHAINLINK_PRICE_FEED_ADDRESS`: The address of the price feed contract of Chainlink deployed on the Ethereum network.
- `USDC_CONTRACT_ADDRESS` : The address of the USDC contract deployed on the Ethereum network.
- `OWNER_ADDRESS` : The address of the owner.
- `PRIVATE_KEY` : The private key of the owner address.
- `INFURA_PROJECT_ID` : The project ID of Infura.
- `ETHERSCAN_API_KEY` : The API key of Etherscan for verification deployed contract.

## Deploymnet
After setting the environment variables, you can deploy `TokenExchange.sol` contract to sepolia by running:
```shell
npm run deploy
```

As testing purpose, the contract is deployed on Sepolia network. You can also deploy the Mock USDC contract for swapping ETH for USDC scenario.

The Mock USDC contract is deployed on Sepolia network: [0xa44035c2aec94b37883dfa7c60a1883e2e211aff](https://sepolia.etherscan.io/token/0xa44035c2aec94b37883dfa7c60a1883e2e211aff)

The Token Exchange contract is deployed on Sepolia network: [0xb59f3a11df9eb2936b4ce763fc34d5bd61c351b8](https://sepolia.etherscan.io/address/0xb59f3a11df9eb2936b4ce763fc34d5bd61c351b8)

## Upgrade Contract
After the contract is deployed, you can upgrade the contract by running:

```shell
npm run upgrade
```

Before upgrading the contract, please make sure that you have set the environment variable `PROXY_CONTRACT_ADDRESS`.

## Contract Explanation
The `TokenExchange` contract is an upgradeable and ownable contract that facilitates the exchange of Ether (ETH) for an ERC20 token. Here's an outline of its architecture:

* Imports: The contract imports several OpenZeppelin contracts for upgradeability, ownership, and ERC20 token handling. It also imports the AggregatorV3Interface from Chainlink for fetching the latest ETH/USD price.

* Inheritance: The contract inherits from Initializable, UUPSUpgradeable, and OwnableUpgradeable contracts from OpenZeppelin. This allows the contract to be upgradeable and have an owner.

* State Variables: The contract has two state variables: token (an ERC20 token contract) and priceFeed (a Chainlink price feed contract for ETH/USD).

* Events: The contract defines three events: Deposit, Swap, and Withdrawal, which are emitted when users deposit ETH, swap ETH for tokens, and when the owner withdraws ETH and tokens, respectively.

* Constructor: The contract has a constructor that disables the initializers, as it uses the OpenZeppelin initializer pattern.

* Initializer: The initialize function is an initializer that sets the initial owner, the ERC20 token contract, and the Chainlink price feed contract.

* Deposit: The deposit function allows users to deposit ETH into the contract, which emits the Deposit event.

* Swap: The swap function allows users to swap their deposited ETH for the ERC20 token. It first handles the deposit, then fetches the latest ETH/USD price from the Chainlink price feed, calculates the token amount based on the price and the deposited ETH amount, and transfers the tokens to the user. It emits the Swap event.

* Withdrawal: The withdraw function allows the contract owner to withdraw both ETH and ERC20 tokens from the contract. It checks if the contract has sufficient balances and transfers the requested amounts to the owner, emitting the Withdrawal event.

* Price Feed: The getLatestPrice function fetches the latest ETH/USD price from the Chainlink price feed and converts it to a 18-decimal format.

* Receive Function: The contract has a receive function that handles ETH deposits when sent directly to the contract.

* Internal Functions: The _handleDeposit function is an internal function that checks if the user has deposited ETH and emits the Deposit event. The _authorizeUpgrade function is an internal function required by the UUPSUpgradeable contract, which allows only the owner to authorize contract upgrades.

## Limitaions
For swapping 100% of the deposited ETH for tokens, the contract needs to have sufficient ERC20 token balance. So, the system needs a program monitoring the swap emitted events and adjusting the ERC20 token balance accordingly. 

The contract also needs to have sufficient ETH balance to handle the swap. Thus, the withdawal should remain sufficient ETH balance in the contract.