import { Injectable } from '@angular/core';
import {
  Firestore, doc, docData, updateDoc, DocumentReference
} from '@angular/fire/firestore';
import { firstValueFrom, Observable } from 'rxjs';
import { IGameWords } from '../models/words';

@Injectable({
  providedIn: 'root'
})
export class GameWordsService {
  cache$!: Observable<any>;
  gameWordsDocRef: DocumentReference = doc(this.firestore, 'game_words/gw_english');

  constructor(private firestore: Firestore) { }
  
  async getWordsOnly(): Promise<string[]> {
    const DBResponse = await firstValueFrom(docData(this.gameWordsDocRef, {idField: 'id'})) as IGameWords;

    return DBResponse.words
  }

  async update(wordsArray: string[]) {
    return updateDoc(this.gameWordsDocRef, {...{words: wordsArray}})
  }
}
