import { createClient } from "@supabase/supabase-js";
import { Punk } from "./punk";

const supabaseUrl = 'https://jurazwyfndjawajazbhu.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY!

export class DB {
  supabase = createClient(supabaseUrl, supabaseKey)

  async addPunkSale(punk: Punk): Promise<any> {
    const { data, error } = await this.supabase
      .from('crypto_punks')
      .upsert([
        {
          punk: punk.PunkIndex,
          block_hash: punk.BlockHash,
          block_number: punk.BlockNumber,
          tx_hash: punk.TxHash,
          tx_index: punk.TxIndex,
          value: punk.Value.toString(),
          from: punk.From,
          to: punk.Owner,
        },
      ])
      .select()
    if (error) {
      return Promise.reject(error)
    }
    return Promise.resolve(data[0])
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

  async getCurrentPunkOwners(): Promise<any[] | null> {
    let { data, error } = await this.supabase
      .from('punk_owners')
      .select('*')
    if (error) {
      return Promise.reject(error)
    }
    return Promise.resolve(data)
  }

  async getCurrentPunkOwner(punk: number): Promise<any> {
    let { data, error } = await this.supabase
      .from('punk_owners')
      .select('*')
      .eq('punk', punk)
    if (error) {
      return Promise.reject(error)
    }
    return Promise.resolve(data)
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