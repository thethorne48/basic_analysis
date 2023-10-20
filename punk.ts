import { Log, EventLog, getNumber, toBigInt, TransactionResponse } from "ethers";

export class Transfer {
  From: string;
  Value: bigint;
  TxHash: string;

  constructor(from: string, value: bigint, txHash: string) {
    this.From = from;
    this.Value = value;
    this.TxHash = txHash;
  }
}

export class Punk {
  static fromEvent(event: Log | EventLog): Punk {
    return new Punk(
      event.blockHash,
      event.transactionHash,
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
      event.transactionHash,
      event.topics[0],
      getNumber(event.topics[1]),
      "0x" + event.topics[2].slice(26),
      txn.to!,
      toBigInt("0x" + txn.data.slice(74)),
    );
  }

  BlockHash: string;

  Event: string;

  PunkIndex: number;

  Transfers: Transfer[] = [];

  Owner: string;

  constructor(blockHash: string, txHash: string, event: string, punkIndex: number, previousOwner: string, Owner: string, value: bigint) {
    this.BlockHash = blockHash;
    this.Event = event;
    this.PunkIndex = punkIndex;
    this.Owner = Owner;
    this.Transfers.push(new Transfer(previousOwner, value, txHash));
  }
}