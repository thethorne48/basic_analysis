import { Config, Context } from "@netlify/functions";
import { DB } from "../../db";

export default async (req: Request, context: Context) => {
  const db = new DB(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

  let result = await db.getCurrentPunkOwners().catch((err) => {
    console.log(err);
  });
  if (result) {
    return new Response(JSON.stringify(result.map((punk) => punk.toObject())), { headers: { "content-type": "application/json" } });
  } else {
    return Response.json({ error: `punks not found` });
  }
}

export const config: Config = {
  path: "/punks/currentOwners"
};

