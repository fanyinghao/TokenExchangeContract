// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TokenExchange.sol";

contract TokenExchangeV2 is TokenExchange {
    string private constant VERSION = "V2";

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function version() public pure returns (string memory) {
        return VERSION;
    }
}