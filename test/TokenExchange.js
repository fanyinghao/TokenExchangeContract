const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("TokenExchange", function () {
  let TokenExchange;
  let tokenExchange;
  let TokenExchangeV2;
  let owner;
  let user;
  let MockToken;
  let mockToken;
  let MockAggregator;
  let mockAggregator;

  // Variables to store contract addresses
  let tokenExchangeAddress;
  let mockTokenAddress;
  let mockAggregatorAddress;

  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const INITIAL_ETH_PRICE = ethers.parseUnits("2000", 8); // $2000 per ETH

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy mock ERC20 token
    MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy(
      "Mock USDC",
      "USDC",
      owner.address,
      INITIAL_SUPPLY
    );
    await mockToken.waitForDeployment();
    mockTokenAddress = await mockToken.getAddress();

    // Deploy mock Chainlink aggregator
    MockAggregator = await ethers.getContractFactory("MockV3Aggregator");
    mockAggregator = await MockAggregator.deploy(8, INITIAL_ETH_PRICE);
    await mockAggregator.waitForDeployment();
    mockAggregatorAddress = await mockAggregator.getAddress();

    // Deploy TokenExchange
    TokenExchange = await ethers.getContractFactory("TokenExchange");
    tokenExchange = await upgrades.deployProxy(
      TokenExchange,
      [owner.address, mockTokenAddress, mockAggregatorAddress],
      { kind: "uups" }
    );
    await tokenExchange.waitForDeployment();
    tokenExchangeAddress = await tokenExchange.getAddress();

    // Transfer some tokens to the exchange
    await mockToken.transfer(tokenExchangeAddress, ethers.parseEther("100000"));
  });

  describe("Initialization", function () {
    it("Should set the correct owner", async function () {
      expect(await tokenExchange.owner()).to.equal(owner.address);
    });

    it("Should set the correct token address", async function () {
      expect(await tokenExchange.token()).to.equal(mockTokenAddress);
    });

    it("Should set the correct price feed address", async function () {
      expect(await tokenExchange.priceFeed()).to.equal(mockAggregatorAddress);
    });
  });

  describe("Deposit", function () {
    it("Should accept ETH deposits", async function () {
      const depositAmount = ethers.parseEther("1");
      await expect(
        tokenExchange.connect(user).deposit({ value: depositAmount })
      )
        .to.emit(tokenExchange, "Deposit")
        .withArgs(user.address, depositAmount);

      const balance = await ethers.provider.getBalance(tokenExchangeAddress);
      expect(balance).to.equal(depositAmount);
    });
  });

  describe("Swap", function () {
    it("Should swap ETH for tokens correctly", async function () {
      const swapAmount = ethers.parseEther("1");
      const expectedTokens = ethers.parseEther("2000"); // 1 ETH * $2000/ETH

      await expect(tokenExchange.connect(user).swap({ value: swapAmount }))
        .to.emit(tokenExchange, "Swap")
        .withArgs(user.address, swapAmount, expectedTokens);

      const userTokenBalance = await mockToken.balanceOf(user.address);
      expect(userTokenBalance).to.equal(expectedTokens);
    });

    it("Should revert if contract has insufficient tokens", async function () {
      const largeSwapAmount = ethers.parseEther("100");
      await expect(
        tokenExchange.connect(user).swap({ value: largeSwapAmount })
      ).to.be.revertedWith("Insufficient Token balance");
    });
  });

  describe("Withdrawal", function () {
    it("Should allow owner to withdraw ETH and tokens", async function () {
      const ethAmount = ethers.parseEther("1");
      const tokenAmount = ethers.parseEther("1000");

      // First, deposit some ETH
      await tokenExchange.deposit({ value: ethAmount });

      const ownerTokenBalance = await mockToken.balanceOf(owner.address);

      await expect(tokenExchange.withdraw(ethAmount, tokenAmount))
        .to.emit(tokenExchange, "Withdrawal")
        .withArgs(owner.address, ethAmount, tokenAmount);

      const ownerTokenBalanceAfter = await mockToken.balanceOf(owner.address);
      expect(ownerTokenBalanceAfter - ownerTokenBalance).to.equal(tokenAmount);
    });

    it("Should revert if non-owner tries to withdraw", async function () {
      await expect(tokenExchange.connect(user).withdraw(0, 0))
        .to.be.revertedWithCustomError(
          tokenExchange,
          "OwnableUnauthorizedAccount"
        )
        .withArgs(user.address);
    });
  });

  describe("Price feed", function () {
    it("Should return the correct price from Chainlink", async function () {
      const price = await tokenExchange.getLatestPrice();
      expect(price).to.equal(INITIAL_ETH_PRICE * BigInt(10 ** 10)); // Convert to 18 decimals
    });

    it("Should revert swap if price feed returns zero", async function () {
      await mockAggregator.updateAnswer(0);
      await expect(
        tokenExchange.connect(user).swap({ value: ethers.parseEther("1") })
      ).to.be.revertedWith("Invalid price feed");
    });
  });

  describe("Upgradeability", function () {
    it("Should upgrade to V2 and keep storage", async function () {
      TokenExchangeV2 = await ethers.getContractFactory("TokenExchangeV2");
      const upgradedExchange = await upgrades.upgradeProxy(
        tokenExchangeAddress,
        TokenExchangeV2
      );

      expect(await upgradedExchange.owner()).to.equal(owner.address);
      expect(await upgradedExchange.token()).to.equal(mockTokenAddress);
      expect(await upgradedExchange.priceFeed()).to.equal(
        mockAggregatorAddress
      );
    });

    it("Should have new functionality in V2", async function () {
      TokenExchangeV2 = await ethers.getContractFactory("TokenExchangeV2");
      const upgradedExchange = await upgrades.upgradeProxy(
        tokenExchangeAddress,
        TokenExchangeV2
      );

      expect(await upgradedExchange.version()).to.equal("V2");
    });

    it("Should not allow non-owners to upgrade", async function () {
      TokenExchangeV2 = await ethers.getContractFactory("TokenExchangeV2");
      await expect(
        upgrades.upgradeProxy(
          tokenExchangeAddress,
          TokenExchangeV2.connect(user)
        )
      )
        .to.be.revertedWithCustomError(
          tokenExchange,
          "OwnableUnauthorizedAccount"
        )
        .withArgs(user.address);
    });
  });
});
