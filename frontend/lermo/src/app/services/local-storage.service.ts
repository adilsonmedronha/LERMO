import { Injectable } from '@angular/core';
import { createEmptyBoard } from '../utils/board-utils';
import { IState, IStorage } from '../models/dataStorage';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  private storage: Storage;

  constructor() {
    this.storage = window.localStorage;
   }

  set(key: string, value: IStorage) {
    if (this.storage) {
      this.storage.setItem(key, JSON.stringify(value));
    }
  }

  get(key: string) {
    if (this.storage) {
      let item = this.storage.getItem(key);
      return item != null ? JSON.parse(item) : null;
    }

    return null;
  }

  clearState(key: string) {
    let oldData: any = this.get(key);

    let newState: IState = {
        tries: createEmptyBoard(), activeRow: 0, gameOver: 0
      }

    this.set(key, {...oldData, state: newState, lastTimePlayed: null})
  }

  clear() {
    if (this.storage) {
      this.storage.clear();
    }
  }
}
