import { Router } from "express";
import { withJWTAuthMiddleware } from "express-kun";
import { getCurrentPunkOwners, getExpensivePunks, getLatestIndexedBlock, getPunk } from "./handler";

const router = Router();
// const protectedRouter = withJWTAuthMiddleware(router, "yourSecretKey");

router.get('/', getCurrentPunkOwners);

router.get('/:punk', getPunk);

router.get('/latestKnownBlock', getLatestIndexedBlock);

router.get('/expensive/:limit', getExpensivePunks)


export { router as punkRouter };
