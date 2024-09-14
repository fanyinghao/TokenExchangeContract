const { vars } = require("hardhat/config");
const { ethers, upgrades } = require("hardhat");

async function main() {
  const PROXY_CONTRACT_ADDRESS = vars.get("PROXY_CONTRACT_ADDRESS");

  const TokenExchangeV2 = await ethers.getContractFactory("TokenExchangeV2");

  console.log("Upgrading TokenExchange to TokenExchangeV2...");

  const upgraded = await upgrades.upgradeProxy(
    PROXY_CONTRACT_ADDRESS,
    TokenExchangeV2
  );

  console.log(
    "TokenExchange has been upgraded to TokenExchangeV2 at:",
    upgraded.address
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
