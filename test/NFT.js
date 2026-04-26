const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

const ether = tokens;

describe("NFT", () => {
  const NAME = "Dapp Punks";
  const SYMBOL = "DP";
  const COST = ether(10);
  const MAX_SUPPLY = 25;
  const BASE_URI =
    "bafybeidpuzq54zqnmgq5lsbegxwrwkgrt72545l3pyj6c4y3qsprfamu6u/";

  let nft, deployer, minter;

  beforeEach(async () => {
    let accounts = await ethers.getSigners();
    deployer = accounts[0];
    minter = accounts[1];
  });

  describe("Deployment", () => {
    const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10);

    beforeEach(async () => {
      const NFT = await ethers.getContractFactory("NFT");
      nft = await NFT.deploy(
        NAME,
        SYMBOL,
        COST,
        MAX_SUPPLY,
        ALLOW_MINTING_ON,
        BASE_URI,
      );
    });

    it("has correct name", async () => {
      expect(await nft.name()).to.equal(NAME);
    });

    it("has correct symbol", async () => {
      expect(await nft.symbol()).to.equal(SYMBOL);
    });

    it("returns the cost to mint", async () => {
      expect(await nft.cost()).to.equal(COST);
    });

    it("returns the maximum total supply", async () => {
      expect(await nft.maxSupply()).to.equal(MAX_SUPPLY);
    });

    it("returns the allowed minting time", async () => {
      expect(await nft.allowMintingOn()).to.equal(ALLOW_MINTING_ON);
    });

    it("returns the baseURI", async () => {
      expect(await nft.baseURI()).to.equal(BASE_URI);
    });

    it("returns the owner", async () => {
      expect(await nft.owner()).to.equal(deployer.address);
    });

    describe("Minting", () => {});

    describe("Success", async () => {
      const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10);

      let transaction, result, balanceBefore;

      beforeEach(async () => {
        const NFT = await ethers.getContractFactory("NFT");
        nft = await NFT.deploy(
          NAME,
          SYMBOL,
          COST,
          MAX_SUPPLY,
          ALLOW_MINTING_ON,
          BASE_URI,
        );

        transaction = await nft.connect(minter).mint(1, { value: COST });
        result = await transaction.wait();
      });

      it("returns the address of the minter", async () => {
        expect(await nft.ownerOf(1)).to.equal(minter.address);
      });

      it("returns total number of tokens the minter owns", async () => {
        expect(await nft.balanceOf(minter.address)).to.equal(1);
      });

      it("returns IPFS URI", async () => {
        expect(await nft.tokenURI(1)).to.equal(`${BASE_URI}1.json`);
      });

      it("updates the total supply", async () => {
        expect(await nft.totalSupply()).to.equal(1);
      });

      it("updates the contract ether balance", async () => {
        expect(await ethers.provider.getBalance(nft.address)).to.equal(COST);
      });

      it("emits Mint event", async () => {
        await expect(transaction)
          .to.emit(nft, "Mint")
          .withArgs(1, minter.address);
      });

      describe("Withdrawing", () => {
        beforeEach(async () => {
          balanceBefore = await ethers.provider.getBalance(deployer.address);
          transaction = await nft.connect(deployer).withdraw();
          result = await transaction.wait();
        });

        it("deducts the contract balance", async () => {
          expect(await ethers.provider.getBalance(nft.address)).to.equal(0);
        });

        it("sends funds to the owner", async () => {
          expect(
            await ethers.provider.getBalance(deployer.address),
          ).to.be.greaterThan(balanceBefore);
        });

        it("emits a Withdraw event", async () => {
          await expect(transaction)
            .to.emit(nft, "Withdraw")
            .withArgs(COST, deployer.address);
        });
      });

      describe("failure", async () => {
        it("prevents non-owner from withdrawing", async () => {
          const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10);
          const NFT = await ethers.getContractFactory("NFT");
          nft = await NFT.deploy(
            NAME,
            SYMBOL,
            COST,
            MAX_SUPPLY,
            ALLOW_MINTING_ON,
            BASE_URI,
          );
          nft.connect(minter).mint(1, { value: COST });

          await expect(nft.connect(minter).withdraw()).to.be.reverted;
        });
      });
    });

    describe("Displaying NFTs", () => {
      let transaction, result;

      describe("Success", async () => {
        const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10);

        beforeEach(async () => {
          const NFT = await ethers.getContractFactory("NFT");
          nft = await NFT.deploy(
            NAME,
            SYMBOL,
            COST,
            MAX_SUPPLY,
            ALLOW_MINTING_ON,
            BASE_URI,
          );

          transaction = await nft.connect(minter).mint(3, { value: ether(30) });
          result = await transaction.wait();
        });
        it("returns all the NFTs for a given owner", async () => {
          let tokenIds = await nft.walletOfOwner(minter.address);
          //Uncomment this line to see the return value
          //console.log("owner wallet", tokenIds);
          expect(tokenIds.length).to.equal(3);
          expect(tokenIds[0].toString()).to.equal("1");
          expect(tokenIds[1].toString()).to.equal("2");
          expect(tokenIds[2].toString()).to.equal("3");
        });
      });
    });
  });
});
