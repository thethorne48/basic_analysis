import { Log, EventLog, getNumber, toBigInt, TransactionResponse, getBigInt } from "ethers";

export class Punk {
  static fromEvent(event: Log | EventLog): Punk {
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
}