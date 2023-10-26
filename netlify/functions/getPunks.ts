import { Config, Context } from "@netlify/functions";
import { DB } from "../../db";

export default async (req: Request, context: Context) => {
  const db = new DB(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

  let result = await db.getCurrentPunkOwners()
  if (result) {
    return Response.json(result.map((punk) => punk.toObject()));
  } else {
    return Response.json({ error: `punks not found` });
  }
}

export const config: Config = {
  path: "/punk/currentOwners"
};

