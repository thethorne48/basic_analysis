import { JsonRpcProvider, Contract, Log, EventLog } from "ethers";
import { Punk } from "./punk";
import fs from "fs";
import { DB } from "./db";
import express from 'express';

// init server
const app = express();
const port = 3000;

// initialize the ETH provider
const provider = new JsonRpcProvider("https://ethereum.publicnode.com");
const MAX_PROVIDER_BLOCKS = 50000;

let latestBlock = await provider.getBlockNumber();

provider.on("block", async (blockNumber: number) => {
  console.log(`New block: ${blockNumber}`);
  latestBlock = blockNumber;
});


// CryptoPunks Address - creation block number 3914495
const CRYPTO_PUNKS_CREATION_BLOCK = 3914495;
const CRYPTO_PUNKS_ADDRESS = "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB";
// BoredApeYachtClub Address - creation block number 12287507
// const BORED_APE_YACHT_CREATION_BLOCK = 12287507;
// const BORED_APE_YACHT_CLUB_ADDRESS = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D";
// ArtBlocks Curated Address - creation block number 11437151
// const ART_BLOCKS_CURATED_CREATION_BLOCK = 11437151;
// const ART_BLOCKS_CURATED_ADDRESS = "0xa7d8d9ef8D8Ce8992Df33D8b8CF4Aebabd5bD270";

// CryptoPunks Contract ABI
const CRYPTO_PUNKS_ABI = JSON.parse(fs.readFileSync("./abi/crypto_punks.json", { encoding: "utf8", flag: "r" }));
// BoredApeYachtClub Contract ABI
// const BORED_APE_YACHT_CLUB_ABI = JSON.parse(fs.readFileSync("./abi/bored_ape_yacht_club.json", { encoding: "utf8", flag: "r" }));
// ArtBlocks Curated Contract ABI
// const ART_BLOCKS_CURATED_ABI = JSON.parse(fs.readFileSync("./abi/art_blocks.json", { encoding: "utf8", flag: "r" }));


const contract = new Contract(CRYPTO_PUNKS_ADDRESS, CRYPTO_PUNKS_ABI, provider);
// const boredApeYachtClubContract = new Contract(BORED_APE_YACHT_CLUB_ADDRESS, BORED_APE_YACHT_CLUB_ABI, provider);
// const artBlocksCuratedContract = new Contract(ART_BLOCKS_CURATED_ADDRESS, ART_BLOCKS_CURATED_ABI, provider);

const db = new DB();
const filter = contract.filters.PunkBought();

app.get('/punks', (req, res) => {
  res.json(db.getPunks());
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});

async function savePunkSale(event: Log | EventLog) {
  if (!event.removed) {
    if (event.topics[3] == "0x0000000000000000000000000000000000000000000000000000000000000000") {
      let txn = await provider.getTransaction(event.transactionHash)
      if (txn) {
        db.addPunkSale(Punk.fromTransaction(txn, event));
      }
    } else {
      db.addPunkSale(Punk.fromEvent(event));
    }
  } else {
    console.log("event removed", event.transactionHash);
  }
}

async function getCryptoPunksSalePrices(provider: JsonRpcProvider) {

  // need to limit the number of blocks queried at a time because getting too many events at once causes errors
  const MAX_BLOCKS = Math.ceil(MAX_PROVIDER_BLOCKS / 50);

  for (let currentBlock = latestBlock - MAX_PROVIDER_BLOCKS * 10; currentBlock < latestBlock; currentBlock += MAX_BLOCKS + 1) {
    console.log("querying from block: " + currentBlock + " to block: " + (currentBlock + MAX_BLOCKS));
    let events = await contract.queryFilter(filter, currentBlock, currentBlock + MAX_BLOCKS)
    for (let event of events) {
      savePunkSale(event);
    }
  }
  console.log(db._punks.size);
}


await getCryptoPunksSalePrices(provider);


provider.on("block", async (blockNumber: number) => {
  console.log(`New block: ${blockNumber}`);
  latestBlock = blockNumber;
  let events = await contract.queryFilter(filter, blockNumber)
  for (let event of events) {
    savePunkSale(event);
  }
});


