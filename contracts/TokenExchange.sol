// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract TokenExchange is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    using SafeERC20 for IERC20;

    IERC20 public token;
    AggregatorV3Interface public priceFeed;

    event Deposit(address indexed user, uint256 ethAmount);
    event Swap(address indexed user, uint256 ethAmount, uint256 tokenAmount);
    event Withdrawal(address indexed owner, uint256 ethAmount, uint256 tokenAmount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _initialOwner, address _token, address _priceFeed) public initializer {
        __Ownable_init(_initialOwner);
        __UUPSUpgradeable_init();

        token = IERC20(_token);
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    function deposit() external payable {
        _handleDeposit();
    }

    function swap() external payable {
        _handleDeposit();  // Handle the deposit first

        uint256 price = getLatestPrice();
        uint256 ethAmount = msg.value; // 获取用户发送的ETH数量
        uint256 tokenAmount =  price * ethAmount / 1 ether;

        require(token.balanceOf(address(this)) >= tokenAmount, "Insufficient Token balance");

        token.safeTransfer(msg.sender, tokenAmount);

        emit Swap(msg.sender, ethAmount, tokenAmount);
    }

    // 合约所有者提取ETH和Token
    function withdraw(uint256 ethAmount, uint256 tokenAmount) external onlyOwner {
        // 确保合约中的ETH余额足够
        require(address(this).balance >= ethAmount, "Insufficient ETH balance");
        // 确保合约中的Token余额足够
        require(token.balanceOf(address(this)) >= tokenAmount, "Insufficient Token balance");

        // 将ETH转账给合约所有者
        payable(owner()).transfer(ethAmount);
        // 将USDC转账给合约所有者
        token.safeTransfer(owner(), tokenAmount);

        // 触发提取事件，记录提取金额
        emit Withdrawal(owner(), ethAmount, tokenAmount);
    }

    function getLatestPrice() public view returns (uint256) {
        (,int256 price,,,) = priceFeed.latestRoundData(); // 获取ETH/USD的最新价格

        require(price > 0, "Invalid price feed");
        return uint256(price * 10 ** 10); // 将价格从8位小数转换为18位小数
    }

    receive() external payable {
        _handleDeposit();
    }

    function _handleDeposit() internal {
        require(msg.value > 0, "Must deposit some ETH");
        emit Deposit(msg.sender, msg.value);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}