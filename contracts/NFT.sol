// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./ERC721Enumerable.sol";
import "./Ownable.sol";
import "./ERC721.sol";

contract NFT is ERC721Enumerable, Ownable {
    uint256 public cost;
    uint256 public maxSupply;
    uint256 public allowMintingOn;
    string public baseURI;
    //Homework #1
    uint256 public maxMintAmount;
    bool public isPaused;

    // Homework #3

    mapping(address => bool) public whitelist;

    event Mint(uint256 amount, address minter);
    event Withdraw(uint256 amount, address owner);

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _cost,
        uint256 _maxSupply,
        uint256 _allowMintingOn,
        string memory _baseURI,
        uint256 _maxMintAmount
    ) ERC721(_name, _symbol) {
        cost = _cost;
        maxSupply = _maxSupply;
        allowMintingOn = _allowMintingOn;
        baseURI = _baseURI;
        maxMintAmount = _maxMintAmount;
    }

    function mint(uint256 _mintAmount) public payable {
        //Homework #2
        require(!isPaused);
        // Only allow minting after specified time
        require(block.timestamp >= allowMintingOn);
        // Must mint at least 1 token
        require(_mintAmount > 0);
        // Require enough payment
        require(msg.value >= cost * _mintAmount);
        // Homework #1
        require(_mintAmount <= maxMintAmount);
        //Homework #3
        require(whitelist[msg.sender]);

        // Create a token
        uint256 supply = totalSupply();

        // Do not let them mint more coins than available
        require(supply + _mintAmount <= maxSupply);

        for (uint256 i = 1; i <= _mintAmount; i++) {
            _safeMint(msg.sender, supply + i);
        }

        // Emit event
        emit Mint(_mintAmount, msg.sender);
    }

    // Return metadata IPFS url
    //Example: "ipfs://bafybeidpuzq54zqnmgq5lsbegxwrwkgrt72545l3pyj6c4y3qsprfamu6u/1.json"

    function tokenURI(
        uint256 _tokenId
    ) public view override returns (string memory) {
        require(_exists(_tokenId), "token does not exist");
        return
            string(
                abi.encodePacked(baseURI, Strings.toString(_tokenId), ".json")
            );
    }

    function walletOfOwner(
        address _owner
    ) public view returns (uint256[] memory) {
        uint256 ownerTokenCount = balanceOf(_owner);
        uint256[] memory tokenIds = new uint256[](ownerTokenCount);
        for (uint256 i; i < ownerTokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
        }
        return tokenIds;
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;

        emit Withdraw(balance, owner());

        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success);
    }

    function pause(bool _state) public onlyOwner {
        isPaused = _state;
    }

    function setCost(uint256 _newCost) public onlyOwner {
        cost = _newCost;
    }

    function addToWhitelist(address _user) public onlyOwner {
        whitelist[_user] = true;
    }
}
