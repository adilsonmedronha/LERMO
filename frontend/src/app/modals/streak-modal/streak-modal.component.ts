import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IStorage } from 'src/app/models/dataStorage';
import { ITimeDiff } from 'src/app/models/time';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { TimeService } from 'src/app/services/time.service';
import { WordsService } from 'src/app/services/words.service';

@Component({
  selector: 'app-streak-modal',
  templateUrl: './streak-modal.component.html',
  styleUrls: ['./streak-modal.component.scss']
})
export class StreakModalComponent implements OnInit {
  timeDiff: ITimeDiff = {
    hours: '24',
    minutes: '59',
    seconds: '59'
  }
  storage!: IStorage;

  constructor(private timeService: TimeService,
              private wordsService: WordsService,
              private storageService: LocalStorageService,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
    this.storage = this.storageService.get(this.data.type)
    this.timeDiff = this.timeService.getTimeDiffCounter(this.wordsService.wordsData.lastUsedDate);

    setInterval(() => this.timeDiff = this.timeService.getTimeDiffCounter(this.wordsService.wordsData.lastUsedDate), 1000)
    this.getVictoryPercentage()
  }

  getVictoryPercentage() {
    const calculation = (this.storage.statistics.games_won / this.storage.statistics.games_played) * 100;

    const decimalCount = (calculation % 1 !== 0) ? (calculation.toString().split('.')[1] || '').length : 0;
    const roundedPercentage = decimalCount > 2 ? calculation.toFixed(2) : calculation;

    return roundedPercentage;
  
  }
}
