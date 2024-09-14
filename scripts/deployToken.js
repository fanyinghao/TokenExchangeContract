const { vars } = require("hardhat/config");
const { ethers, upgrades } = require("hardhat");

async function main() {
  const OWNER_ADDRESS = vars.get("OWNER_ADDRESS");

  const Token = await ethers.getContractFactory("MockERC20");

  const token = await upgrades.deployProxy(Token, [
    "Mock USDC",
    "USDC",
    OWNER_ADDRESS,
    10000000000000000, // 100,000,000 USDC
  ]);

  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();

  console.log("TokenExchange deployed to:", tokenAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
