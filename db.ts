import { Punk } from "./punk";

export class DB {
  _punks: Map<number, Punk> = new Map();

  addPunkSale(punk: Punk) {
    let existing = this._punks.get(punk.PunkIndex);
    if (existing) {
      existing.Transfers.push(punk.Transfers[0])
      punk.Transfers = existing.Transfers;
      this._punks.set(punk.PunkIndex, punk);
    } else {
      this._punks.set(punk.PunkIndex, punk);
    }
  }

  getPunks(): any[] {
    let punks: Array<any> = [];
    this._punks.forEach((value) => {
      let transfers = [];
      for (let index = 0; index < value.Transfers.length; index++) {
        const element = value.Transfers[index];
        transfers.push({
          From: element.From,
          Value: element.Value.toString(),
          TxHash: element.TxHash,
        });
      }
      punks.push({
        BlockHash: value.BlockHash,
        Event: value.Event,
        PunkIndex: value.PunkIndex,
        Transfers: transfers,
        Owner: value.Owner,
      });
    });
    return punks;
  }

  getAveragePunkSalePrice(punkIndex: number): BigInt {
    let punk = this._punks.get(punkIndex);
    if (punk) {
      let total = BigInt(0);
      for (let transfer of punk.Transfers) {
        total += transfer.Value;
      }
      return total / BigInt(punk.Transfers.length);
    } else {
      return BigInt(0);
    }
  }

}