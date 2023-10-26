import { Config, Context } from "@netlify/functions";
import { DB } from "../../db";

export default async (req: Request, context: Context) => {
  const db = new DB(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

  let punk = parseInt(context.params.punkID);
  let result = await db.getCurrentPunkOwner(punk)
  if (result) {
    return Response.json(result.toObject());
  } else {
    return Response.json({ error: `punk ${punk} not found` });
  }
}

export const config: Config = {
  path: "/punk/:punkID"
};

