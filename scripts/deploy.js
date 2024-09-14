const { vars } = require("hardhat/config");
const { ethers, upgrades } = require("hardhat");

async function main() {
  const USDC_CONTRACT_ADDRESS = vars.get("USDC_CONTRACT_ADDRESS");
  const CHAINLINK_PRICE_FEED_ADDRESS = vars.get("CHAINLINK_PRICE_FEED_ADDRESS");
  const OWNER_ADDRESS = vars.get("OWNER_ADDRESS");

  const TokenExchange = await ethers.getContractFactory("TokenExchange");

  const tokenExchange = await upgrades.deployProxy(TokenExchange, [
    OWNER_ADDRESS,
    USDC_CONTRACT_ADDRESS,
    CHAINLINK_PRICE_FEED_ADDRESS,
  ]);

  await tokenExchange.waitForDeployment();
  const tokenExchangeAddress = await tokenExchange.getAddress();

  console.log("TokenExchange deployed to:", tokenExchangeAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
