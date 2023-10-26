import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { Punk } from "./punk";
import { Database } from "./supabase";

export class DB {
  supabase: SupabaseClient<Database, 'public', any>

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  async addPunkSale(punks: Punk[]): Promise<Punk[]> {
    let input = punks.map((punk) => punk.toObject())

    const { data, error } = await this.supabase
      .from('crypto_punks')
      .upsert(input)
      .select()
    if (error) {
      return Promise.reject(error)
    }
    let results: Punk[] = [];
    data.forEach((punk) => {
      results.push(Punk.fromSupabase(punk));
    })
    console.log("added " + results.length + " punks");
    return Promise.resolve(results);
  }


  async getLastIndexedBlock(): Promise<number | undefined> {
    let { data, error } = await this.supabase
      .from('crypto_punks')
      .select('block_number')
      .order('block_number', { ascending: false })
      .limit(1)
    if (error) {
      console.log(error)
      return Promise.reject(error)
    }
    return Promise.resolve(data?.at(0)?.block_number || undefined)
  }

  async getPunks(): Promise<any[] | null> {
    let { data, error } = await this.supabase
      .from('crypto_punks')
      .select('*');
    if (error) {
      return Promise.reject(error)
    }
    return Promise.resolve(data)
  }

  async getAvgSalePrice(): Promise<any[] | null> {
    let { data, error } = await this.supabase
      .from('crypto_punks')
      .select('punk, avg(cast(value as numeric)) as avg_sale_price')
      .order('punk')
    if (error) {
      return Promise.reject(error)
    }
    return Promise.resolve(data)
  }

  async getCurrentPunkOwners(): Promise<Punk[] | null> {
    let { data, error } = await this.supabase
      .from('punk_owners')
      .select('*')
    if (error) {
      return Promise.reject(error)
    }
    if (data) {
      let punks: Punk[] = [];
      data.forEach((punk) => {
        punks.push(Punk.fromSupabase(punk));
      })
      return Promise.resolve(punks);
    }
    return Promise.resolve(data)
  }

  async getCurrentPunkOwner(punk: number): Promise<Punk | undefined> {
    let { data, error } = await this.supabase
      .from('punk_owners')
      .select('*')
      .eq('punk', punk)
    if (error) {
      return Promise.reject(error)
    }
    if (data?.length == 1)
      return Promise.resolve(Punk.fromSupabase(data[0]))
    else
      return Promise.resolve(undefined)
  }

  async getExpensivePunks(limit: number): Promise<any[] | null> {
    let { data, error } = await this.supabase
      .from('punk_owners_eth')
      .select('*')
      .order('value_eth', { ascending: false })
      .limit(limit)
    if (error) {
      console.log("query error:", error)
      return Promise.reject(error)
    }
    return Promise.resolve(data)
  }
}