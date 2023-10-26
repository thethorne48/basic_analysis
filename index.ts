import { JsonRpcProvider, Contract, Log, EventLog, DeferredTopicFilter } from "ethers";
import { Punk } from "./punk";
import fs from "fs";
import { DB } from "./db";
import { getCurrentPunkOwners, getExpensivePunks, getLatestIndexedBlock, getPunk } from "./handler";
import express from 'express';
import { config } from "dotenv";
import { Network } from "ethers";
import { punkRouter } from "./punkRouter";

config();

// init server
const app = express();
const port = 3000;

// initialize the ETH provider
// const PROVIDER_URL = "https://rpc.flashbots.net"
// const PROVIDER_URL = "https://eth-mainnet.gateway.pokt.network/v1/5f3453978e354ab992c4da79"
// const PROVIDER_URL = "https://rpc.ankr.com/eth"
const PROVIDER_URL = "https://ethereum.publicnode.com"
// const MAX_PROVIDER_BLOCKS = 50000;
const MAX_PROVIDER_BLOCKS = 2500;
const STATIC_NETWORK = new Network("ethereum", 1);
const provider = new JsonRpcProvider(PROVIDER_URL, undefined, { batchMaxSize: 5, batchMaxCount: MAX_PROVIDER_BLOCKS / 25, staticNetwork: STATIC_NETWORK });

const MAX_ATTEMPTS = 10;

let latestBlock = await provider.getBlockNumber();


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

const db = new DB(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
const filter = contract.filters.PunkBought(null, null, null, null);


// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use('/punk', punkRouter)

// app.get('/punks', getCurrentPunkOwners);
// app.get('/punks/:punk', getPunk);
// app.get('/punks/latestKnownBlock', getLatestIndexedBlock);
// app.get('/punks/expensive/:limit', getExpensivePunks)


// app.get('sales/:aggregator', async (req, res) => {
//   let aggregator = req.params.aggregator;
//   let sales = await db.getSales(aggregator);
//   res.json(sales);
// })

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`)
// });

async function savePunkSale(events: Log[] | EventLog[]): Promise<any> {
  let punks = events.filter((event) => !event.removed).map(async (event) => {
    if (event.topics.length != 2 && event.topics[3] == "0x0000000000000000000000000000000000000000000000000000000000000000") {
      let txn = await provider.getTransaction(event.transactionHash)
      if (txn) {
        return Promise.resolve(Punk.fromTransaction(txn, event));
      }
    } else {
      return Promise.resolve(Punk.fromEvent(event));
    }
  }, events)
  let mappedPunks = await Promise.all(punks)
  let onlyPunks: Punk[] = [];
  mappedPunks.forEach((punk) => {
    if (punk)
      onlyPunks.push(punk);
  });
  return db.addPunkSale(onlyPunks);
}

async function getCryptoPunkData(filter: DeferredTopicFilter, startBlock: number, endBlock: number, attempt: number = 0): Promise<Punk[]> {
  console.log("querying from block: " + startBlock + " to block: " + endBlock);
  let events = await contract.queryFilter(filter, startBlock, endBlock).catch((err) => {
    console.log(err);
    return Promise.reject(err);
  });

  return await savePunkSale(events).catch(async (err: unknown) => {
    console.log(`${startBlock} - ${endBlock}(attempt: ${attempt}), ${JSON.stringify(err)}`);
    let results: Punk[] = [];
    if (attempt < MAX_ATTEMPTS) {
      let middle = Math.floor((startBlock + endBlock) / 2);
      let a = await getCryptoPunkData(filter, startBlock, middle, attempt + 1).catch((err) => {
        console.log(err);
        return Promise.reject(err);
      })
      let b = await getCryptoPunkData(filter, middle + 1, endBlock, attempt + 1).catch((err) => {
        console.log(err);
        return Promise.reject(err);
      })
      results = a.concat(b);
    }
    return results;
  }).finally(() => {
    console.log("finished querying from block: " + startBlock + " to block: " + endBlock);
  });
}

// async function getCryptoPunksSalePrices(startBlock: number = CRYPTO_PUNKS_CREATION_BLOCK) {
//   // need to limit the number of blocks queried at a time because getting too many events at once causes errors
//   const MAX_BLOCKS = Math.ceil(MAX_PROVIDER_BLOCKS / 5);

//   for (let currentBlock = startBlock; currentBlock < latestBlock; currentBlock += MAX_BLOCKS + 1) {
//     await getCryptoPunkSalePrice(filter, currentBlock, currentBlock + MAX_BLOCKS).catch((err) => {
//       console.log(err);
//     });
//   }
// }

// await getCryptoPunksSalePrices(await db.getLastIndexedBlock());


async function getCryptoPunksMintData(startBlock: number = CRYPTO_PUNKS_CREATION_BLOCK) {
  // need to limit the number of blocks queried at a time because getting too many events at once causes errors
  const MAX_BLOCKS = Math.ceil(MAX_PROVIDER_BLOCKS / 1);

  const filter = contract.filters.PunkTransfer(null, null, null);

  // let transfers = await contract.queryFilter(filter, startBlock, startBlock + MAX_BLOCKS)
  // console.log(JSON.stringify(transfers, null, 2))

  for (let currentBlock = startBlock; currentBlock < latestBlock; currentBlock += MAX_BLOCKS + 1) {
    await getCryptoPunkData(filter, currentBlock, currentBlock + MAX_BLOCKS).catch((err) => {
      console.log(err);
    });
  }
}

await getCryptoPunksMintData(11856951);

// provider.on("block", async (blockNumber: number) => {
//   console.log(`New block: ${blockNumber}`);
//   latestBlock = blockNumber;
//   let events = await contract.queryFilter(filter, blockNumber)
//   for (let event of events) {
//     savePunkSale(event);
//   }
// });


