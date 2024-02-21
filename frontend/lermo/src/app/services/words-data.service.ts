import { Injectable } from '@angular/core';
import {
  Firestore, doc, docData, updateDoc, DocumentReference
} from '@angular/fire/firestore';
import { firstValueFrom, Observable, shareReplay } from 'rxjs';
import { IWordsData, WordsData } from '../models/usedWords';

@Injectable({
  providedIn: 'root'
})
export class WordsDataService {
  wordsDataDocRef: DocumentReference = doc(this.firestore, 'words_data/wd_english');
  cache$!: Observable<any>;

  constructor(private firestore: Firestore) { }

  async get(): Promise<IWordsData>{

    if (!this.cache$) {
      this.cache$ = docData(this.wordsDataDocRef, {idField: 'id'}).pipe(
        shareReplay(1)
      );
    }

    return  await firstValueFrom(this.cache$) as IWordsData;
  }

  async update(newWordsData: WordsData) {
    return updateDoc(this.wordsDataDocRef, {...newWordsData.toJson()})
  }
}
