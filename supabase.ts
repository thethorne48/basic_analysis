export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      crypto_punks: {
        Row: {
          block_hash: string
          block_number: number
          from: string
          punk: number
          to: string
          tx_hash: string
          tx_index: number
          value: string
        }
        Insert: {
          block_hash: string
          block_number: number
          from: string
          punk: number
          to: string
          tx_hash: string
          tx_index: number
          value: string
        }
        Update: {
          block_hash?: string
          block_number?: number
          from?: string
          punk?: number
          to?: string
          tx_hash?: string
          tx_index?: number
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      punk_owners: {
        Row: {
          block_hash: string | null
          block_number: number | null
          from: string | null
          punk: number | null
          to: string | null
          tx_hash: string | null
          tx_index: number | null
          value: string | null
        }
        Relationships: []
      }
      punk_owners_eth: {
        Row: {
          block_hash: string | null
          block_number: number | null
          from: string | null
          punk: number | null
          to: string | null
          tx_hash: string | null
          tx_index: number | null
          value: string | null
          value_eth: number | null
        }
        Insert: {
          block_hash?: string | null
          block_number?: number | null
          from?: string | null
          punk?: number | null
          to?: string | null
          tx_hash?: string | null
          tx_index?: number | null
          value?: string | null
          value_eth?: never
        }
        Update: {
          block_hash?: string | null
          block_number?: number | null
          from?: string | null
          punk?: number | null
          to?: string | null
          tx_hash?: string | null
          tx_index?: number | null
          value?: string | null
          value_eth?: never
        }
        Relationships: []
      }
    }
    Functions: {
      eth_str_as_numeric:
        | {
            Args: {
              value: string
            }
            Returns: number
          }
        | {
            Args: Record<PropertyKey, never>
            Returns: {
              block_hash: string
              block_number: number
              from: string
              punk: number
              to: string
              tx_hash: string
              tx_index: number
              value: string
            }[]
          }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
