import { Component, OnInit } from '@angular/core';
import { IStorage } from '../models/dataStorage';
import { LocalStorageService } from '../services/local-storage.service';
import { WordsService } from '../services/words.service';
import { createEmptyBoard } from '../utils/board-utils';
import { HowToPlayNormalModalComponent } from '../modals/how-to-play-normal-modal/how-to-play-normal-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { TimeService } from '../services/time.service';
import { WordsDataService } from '../services/words-data.service';

@Component({
  selector: 'app-standard-page',
  templateUrl: './standard-page.component.html',
  styleUrls: ['./standard-page.component.scss']
})
export class StandardPageComponent implements OnInit{

  board: string[][] = createEmptyBoard();
  activeIdx: number = 0;
  
  constructor(private localStorageService: LocalStorageService,
              private timeService: TimeService,
              private wordsService: WordsService,
              private wordsDataService: WordsDataService,
              public dialog: MatDialog) {
  }

  async ngOnInit() {
    this.openHowToPlayModal();
    await this.wordsService.chooseNewWord();
  
    let storageData: IStorage = this.localStorageService.get('normal');
    let wordsData = await this.wordsDataService.get();

    if (storageData != null) {
      if (storageData.lastTimePlayed == null) {
        storageData.lastTimePlayed = wordsData.current_word_date;
      }

      if (this.timeService.getDatesDifference(storageData.lastTimePlayed, wordsData.current_word_date) >= 1) {
        this.localStorageService.clearState('normal');
        storageData.state.tries = createEmptyBoard();
        storageData.state.activeRow = 0;
        storageData.state.gameOver = 0;
      }
  
      this.board = storageData.state.tries;
      this.activeIdx = storageData.state.activeRow;

      this.localStorageService.set('normal', {
        ...storageData,
        lastTimePlayed: wordsData.current_word_date
      })

    } else {
      this.localStorageService.set('normal', {
        lastTimePlayed: wordsData.current_word_date,
        state: {
          tries: this.board,
          activeRow: 0,
          gameOver: 0,
        },
        statistics: {
          games_played: 0,
          actual_streak: 0,
          games_won: 0,
          best_streak: 0,
        },
      });
    }
  }

  openHowToPlayModal() {
    const dialogRef = this.dialog.open(HowToPlayNormalModalComponent, {
      width: '50vh',
      maxWidth: '85vw',
      maxHeight: '90vh',
      minHeight: 'calc(60vh - 90px)',
      height : 'auto',
      panelClass: 'custom-container',
    });
    dialogRef.afterClosed().subscribe(result => {
      let elem = document.getElementById(`row-0-letter-0`);
      elem?.focus()
    });
  }

  computeTry(state: any) {

    let normalObj: IStorage = this.localStorageService.get('normal');

    normalObj.state.tries = this.board;
    normalObj.state.gameOver = state.gameOver;
    normalObj.state.activeRow = state.activeRow;

    this.localStorageService.set('normal', normalObj);
  }

  computePlay(won: boolean) {
    let normalObj: IStorage = this.localStorageService.get('normal');
    let oldStatistics = normalObj.statistics

    oldStatistics.games_played = oldStatistics.games_played + 1;
    
    if (won) {
      oldStatistics.games_won = oldStatistics.games_won + 1;
      oldStatistics.actual_streak = oldStatistics.actual_streak + 1;

      oldStatistics.best_streak = oldStatistics.actual_streak > oldStatistics.best_streak ? oldStatistics.actual_streak: oldStatistics.best_streak;
    }
    else {
      oldStatistics.actual_streak = 0;
    }

    normalObj = {...normalObj, statistics: oldStatistics};

    this.localStorageService.set('normal', normalObj);
  }

}
