import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom} from 'rxjs';
import { WordsData } from '../models/usedWords';

import { WordsDataService } from './words-data.service';
import { GameWordsService } from './game-words.service';
import { TimeService } from './time.service';
import { LocalStorageService } from './local-storage.service';
import { Router } from '@angular/router';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class WordsService {
  wordsData!: WordsData;

  constructor(private http: HttpClient, 
              private wordsDataService: WordsDataService,
              private gameWordsService: GameWordsService,
              private timeService: TimeService,
              private storageService: LocalStorageService) {
              }

  async getWordsData(): Promise<WordsData> {

    if (this.wordsData == null) {
      let wordsDataFromDB = await this.wordsDataService.get();
      let allWords = await this.gameWordsService.getWordsOnly();

      this.wordsData = WordsData.fromJson(wordsDataFromDB, allWords);
    }

    return this.wordsData;
  }
  
  async chooseNewWord() {
    await this.getWordsData();

    if (this.timeService.getDayDiff(this.wordsData.lastUsedDate) < 1) {
      return;
    }

    this.storageService.clearState('normal')
    this.storageService.clearState('video')

    // getting unused words from database
    let gameWords = await this.gameWordsService.getWordsOnly();
    // randomly choosing a word
    let choosenWordIdx = Math.floor(Math.random() * gameWords.length);
    let choosenWord = gameWords[choosenWordIdx];

    this.wordsData.currentWord = choosenWord;

    let nowDate = moment().tz('America/Sao_Paulo');

    let lastDate = nowDate.clone();
    lastDate.hour(23);
    lastDate.minute(59);
    lastDate.second(59);
    lastDate.millisecond(59);
    lastDate.subtract(1, 'days')

    this.wordsData.lastUsedDate = lastDate.valueOf();


    gameWords.splice(choosenWordIdx, 1)
    this.wordsData.toJson()

    this.gameWordsService.update(gameWords);
    this.wordsDataService.update(this.wordsData);
  }

  readCsvFile() {
    return this.http.get('../../assets/data/parsed-alpha-english.csv', { responseType: 'text' })
  }

  async readData() {
    const fileNames = ['X_tiny_80min.txt', 'Y_tiny_80min.txt']
    const modelData: any = []
    for (const fileName of fileNames) {
    
      const data = await firstValueFrom(this.http.get(`../../assets/data/${fileName}`, { responseType: 'text' }))
      let fileContent = data;
      const lines = fileContent.split('\n');
      const fileData = lines.map((line) => line.split(' '));

      modelData.push(fileData);

    }
    return modelData;
  }

  getCurrentWord(): string {
    return this.wordsData.currentWord
  }

  populateGameWords() {
    this.readCsvFile().subscribe((res) => {
      let dt = res.split('\n')

      let wd = new WordsData("teste", 1692845968888, [], [])
      
      this.gameWordsService.update(dt)
      this.wordsDataService.update(wd)
    });

  }

}
