import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, Renderer2 } from '@angular/core';
import { Guess } from '../models/guess';
import { WordsService } from '../services/words.service';

@Component({
  selector: 'app-tentative',
  templateUrl: './tentative.component.html',
  styleUrls: ['./tentative.component.scss']
})
export class TentativeComponent implements OnInit ,AfterViewInit {

  @Input() isActive: boolean = false;
  @Input() tentative!: string[];
  @Input() rowNum!: number;
  @Output() guess: EventEmitter<Guess> = new EventEmitter();


    constructor(private wordsService: WordsService, private renderer: Renderer2) { }

    ngAfterViewInit(): void {
      if (this.isActive) {
        let elem = document.getElementById(`row-${this.rowNum}-letter-0`);
        elem?.focus()
      }
    }

    ngOnInit() { }

    handleInput(event: any, i: number) {
      let dataString = event.data;
      if (!(dataString && dataString.length === 1 && dataString.match(/[a-z]/i))) {
        event.srcElement.textContent = '';
        return
      }
      
      this.tentative[i] = event.data;
      event.srcElement.textContent = event.data;

    }

  validGuess() {
    let tentativeWord = this.tentative.join("").toLowerCase();
    let choosenWord = this.wordsService.getCurrentWord();

    if (tentativeWord.length < choosenWord.length) {
      return false;
    }

    for (let i = 0; i < 5; i++ ) {
      let input: any = document.getElementById(`row-${this.rowNum}-letter-${i}`);
      
      if (tentativeWord[i] === choosenWord[i]) {
        this.renderer.setStyle(input, 'background-color', 'green')
      }
      else if (choosenWord.substring(0, i).includes(tentativeWord[i])
          ||   choosenWord.substring(i).includes(tentativeWord[i])) {
        this.renderer.setStyle(input, 'background-color', '#96950a')
      }
      else {
        this.renderer.setStyle(input, 'background-color', 'red')
      }
    }

    return true;

  }
    
  onDigitInput(event: any, i: number){
    
    let element;

    switch(event.code as string) {
      case 'Enter':
        let nextTentative: boolean = this.validGuess();
        this.guess.emit({guessed_word: this.tentative.join(""),  valid: nextTentative});
        break;
      case 'Backspace':
        let shouldMoveCursor: boolean = event.srcElement.textContent === '' ;
        element = shouldMoveCursor ? event.srcElement.previousElementSibling : null;
        
        this.tentative[i] = '';
        event.srcElement.textContent = '';
        break;
      default:
        element = event.srcElement.nextElementSibling;
        if (event.key.match(/^[a-zA-Z]{1}$/g)) {
          event.srcElement.textContent = event.key.toUpperCase();
          this.tentative[i] = event.key
        }
        break;
    }
    
    if(element == null)
      return;
    else
      element.focus();
  }

}
