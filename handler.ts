import { DB } from "./db";

const db = new DB();

async function getPunk(req: any, res: any) {
  let punk = parseInt(req.params.punk);
  res.json(await db.getCurrentPunkOwner(punk));
}

async function getCurrentPunkOwners(req: any, res: any) {
  res.json(await db.getCurrentPunkOwners());
}

async function getLatestIndexedBlock(req: any, res: any) {
  res.json(await db.getLastIndexedBlock());
}

async function getExpensivePunks(req: any, res: any) {
  let limit = parseInt(req.params.limit || 25);
  res.json(await db.getExpensivePunks(limit || 25));
}

export { getPunk, getCurrentPunkOwners, getLatestIndexedBlock, getExpensivePunks };