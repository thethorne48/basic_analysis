import { Config, Context } from "@netlify/functions";
import { DB } from "../../db";
import { Contract, DeferredTopicFilter, EventLog, JsonRpcProvider, Log, Network } from "ethers";
import { Punk } from "../../punk";
import fs from "fs";

const PROVIDER_URL = "https://ethereum.publicnode.com"

const MAX_PROVIDER_BLOCKS = 2500;
const STATIC_NETWORK = new Network("ethereum", 1);
const provider = new JsonRpcProvider(PROVIDER_URL, undefined, { batchMaxSize: 5, batchMaxCount: MAX_PROVIDER_BLOCKS / 25, staticNetwork: STATIC_NETWORK });

const MAX_ATTEMPTS = 10;

const db = new DB(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

const CRYPTO_PUNKS_CREATION_BLOCK = 3914495;
const CRYPTO_PUNKS_ADDRESS = "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB";

const CRYPTO_PUNKS_ABI = JSON.parse(fs.readFileSync("./abi/crypto_punks.json", { encoding: "utf8", flag: "r" }));

const contract = new Contract(CRYPTO_PUNKS_ADDRESS, CRYPTO_PUNKS_ABI, provider);

const filter = contract.filters.PunkBought(null, null, null, null);

async function savePunkSale(events: Log[] | EventLog[]): Promise<Punk[]> {
  let punks = events.filter((event) => !event.removed).map(async (event) => {
    if (event.topics[3] == "0x0000000000000000000000000000000000000000000000000000000000000000") {
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

async function syncCryptoPunkSalePrice(filter: DeferredTopicFilter, startBlock: number, endBlock: number, attempt: number = 0): Promise<Punk[]> {
  console.log("querying from block: " + startBlock + " to block: " + endBlock);
  let events = await contract.queryFilter(filter, startBlock, endBlock).catch((err) => {
    console.log(err);
    return Promise.reject(err);
  });

  return await savePunkSale(events).catch(async (err: unknown) => {
    console.log(`${startBlock} - ${endBlock}(attempt: ${attempt}), ${err}`);
    let results: Punk[] = [];
    if (attempt < MAX_ATTEMPTS) {
      let middle = Math.floor((startBlock + endBlock) / 2);
      let a = await syncCryptoPunkSalePrice(filter, startBlock, middle, attempt + 1).catch((err) => {
        console.log(err);
        return Promise.reject(err);
      })
      let b = await syncCryptoPunkSalePrice(filter, middle + 1, endBlock, attempt + 1).catch((err) => {
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

async function syncCryptoPunksSalePrices(startBlock: number = CRYPTO_PUNKS_CREATION_BLOCK): Promise<Punk[]> {
  // need to limit the number of blocks queried at a time because getting too many events at once causes errors
  const MAX_BLOCKS = Math.ceil(MAX_PROVIDER_BLOCKS / 5);

  const body = new ReadableStream<Punk>({
    async start(controller) {
      for (let currentBlock = startBlock; currentBlock < await provider.getBlockNumber(); currentBlock += MAX_BLOCKS + 1) {
        let punks = await syncCryptoPunkSalePrice(filter, currentBlock, currentBlock + MAX_BLOCKS).catch((err) => {
          console.log(err);
        });
        if (punks) {
          punks.forEach((punk) => {
            controller.enqueue(punk);
          });
        }
      }
      controller.close();
    }
  });

  let results: Punk[] = [];
  for (let currentBlock = startBlock; currentBlock < await provider.getBlockNumber(); currentBlock += MAX_BLOCKS + 1) {
    let punks = await syncCryptoPunkSalePrice(filter, currentBlock, currentBlock + MAX_BLOCKS).catch((err) => {
      console.log(err);
    });
    if (punks) {
      results = results.concat(punks);
    }
  }
  return results
}

export default async (req: Request, context: Context) => {
  let startBlock = new URL(req.url).searchParams.get("startBlock");
  let lastBlock = await db.getLastIndexedBlock();
  return new Response(
    JSON.stringify(
      (await syncCryptoPunksSalePrices(startBlock ? parseInt(startBlock) : lastBlock))
        .filter((punk) => !!punk)
        .map((punk) => punk.toObject)
    ),
    {
      headers: { "content-type": "application/json" },
    });
}

export const config: Config = {
  path: "/punk/sync"
};

