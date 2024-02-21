import { Component, OnInit, Output } from '@angular/core';
import { Guess } from '../models/guess';
import { WordsService } from '../services/words.service';

@Component({
  selector: 'app-tentatives-board',
  templateUrl: './tentatives-board.component.html',
  styleUrls: ['./tentatives-board.component.scss']
})
export class TentativesBoardComponent implements OnInit{
  activeIdx = 0;

  board: string[][] = this.createEmptyBoard();


  constructor(private wordsService: WordsService) { }

  ngOnInit() { }

  createEmptyBoard(): string[][] {
    let newBoard: string[][] = [];

    for (let i = 0; i < 6; i++) { 
      newBoard.push(['', '', '', '', ''])
    }

    return newBoard;
  }

  successfullGuess (guess: Guess) {
    let selectedWord = this.wordsService.getCurrentWord()
    if (guess.valid){
      this.activeIdx = this.activeIdx < 4 && guess.guessed_word.toLowerCase() === selectedWord  ? 99 : this.activeIdx+1 ;
    }
  }

}
