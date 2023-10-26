import { Log, EventLog, getNumber, toBigInt, TransactionResponse, getBigInt, toNumber } from "ethers";

export class Punk {

  static fromSupabase(data: {
    punk: number,
    block_hash: string,
    tx_hash: string,
    tx_index: number,
    from: string,
    to: string,
    value: string,
    block_number: number,
  }): Punk {
    return new Punk(
      data.block_hash,
      data.block_number,
      data.tx_hash,
      data.tx_index,
      "",
      data.punk,
      data.from,
      data.to,
      getBigInt(data.value),
    )
  }

  static fromEvent(event: Log | EventLog): Punk {
    if (event.topics.length == 2) {
      return new Punk(
        event.blockHash,
        event.blockNumber,
        event.transactionHash,
        event.transactionIndex,
        event.topics[0],
        toNumber(event.data),
        "",
        "0x" + event.topics[1].slice(26),
        BigInt(0),
      )
    } else if (event.topics.length == 3) {
      return new Punk(
        event.blockHash,
        event.blockNumber,
        event.transactionHash,
        event.transactionIndex,
        event.topics[0],
        getNumber(event.data),
        "0x" + event.topics[1].slice(26),
        "0x" + event.topics[2].slice(26),
        BigInt(0),
      )
    } else {
      return new Punk(
        event.blockHash,
        event.blockNumber,
        event.transactionHash,
        event.transactionIndex,
        event.topics[0],
        getNumber(event.topics[1]),
        "0x" + event.topics[2].slice(26),
        "0x" + event.topics[3].slice(26),
        toBigInt(event.data),
      )
    }
  }

  static fromTransaction(txn: TransactionResponse, event: Log | EventLog): Punk {
    return new Punk(
      event.blockHash,
      event.blockNumber,
      event.transactionHash,
      event.transactionIndex,
      event.topics[0],
      getNumber(event.topics[1]),
      "0x" + event.topics[2].slice(26),
      txn.to!,
      toBigInt("0x" + txn.data.slice(74)),
    );
  }

  BlockHash: string;

  BlockNumber: number;

  Event: string;

  PunkIndex: number;

  Owner: string;

  From: string;

  Value: BigInt;

  TxHash: string;

  TxIndex: number;


  constructor(blockHash: string, blockNumber: number, txHash: string, txIndex: number, event: string, punkIndex: number, previousOwner: string, Owner: string, value: bigint) {
    this.BlockHash = blockHash;
    this.BlockNumber = blockNumber;
    this.Event = event;
    this.PunkIndex = punkIndex;
    this.Owner = Owner;
    this.From = previousOwner;
    this.Value = value;
    this.TxHash = txHash;
    this.TxIndex = txIndex;
  }

  toObject(): object {
    return {
      punk: this.PunkIndex,
      block_hash: this.BlockHash,
      block_number: this.BlockNumber,
      tx_hash: this.TxHash,
      tx_index: this.TxIndex,
      value: this.Value.toString(),
      from: this.From,
      to: this.Owner,
    }
  }

  toString(): string {
    return JSON.stringify(this.toObject());
  }
}