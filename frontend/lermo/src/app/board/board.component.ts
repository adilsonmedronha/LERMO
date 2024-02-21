import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnInit, Output, Renderer2, SimpleChanges } from '@angular/core';
import { SignChange } from '../models/signChange';
import { WordsService } from '../services/words.service';
import { createEmptyBoard } from '../utils/board-utils';
import { MatDialog } from '@angular/material/dialog';
import { StreakModalComponent } from '../modals/streak-modal/streak-modal.component';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { IState } from '../models/dataStorage';
import { animate, state, style, transition, trigger } from '@angular/animations';

export type FadeState = 'visible' | 'hidden';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
  animations: [
    trigger('state', [
      state(
        'visible',
        style({
          opacity: '1'
        })
      ),
      state(
        'hidden',
        style({
          opacity: '0'
        })
      ),
      transition('* => visible', [animate('500ms ease-out')]),
      transition('visible => hidden', [animate('500ms ease-out')])
    ])
  ]
})
export class BoardComponent implements AfterViewInit, OnChanges, OnInit{

  @Input()
  signChange: SignChange | undefined = undefined;

  @Input()
  activeRow: number = 0;
  
  _board!: string[][];
  get board() {
    return this._board;
  }

  @Input() set board(newBoard: string[][]) {
    this._board = newBoard;
    this.paintWords();
  }

  @Output() 
  nextLetter: EventEmitter<number> = new EventEmitter();

  @Output()
  try: EventEmitter<IState> = new EventEmitter();

  @Output()
  play: EventEmitter<boolean> = new EventEmitter();

  activeCol: number = 0;
  gameType: string = 'normal';
  animationState: FadeState = 'hidden'

  firstRow = ['Q','W','E','R','T','Y','U','I','O','P',];
  secondRow = ['A','S','D','F','G','H','J','K','L'];
  thirdRow = ['Z','X','C','V','B','N','M'];

  constructor(private wordsService: WordsService,
              private renderer: Renderer2,
              public dialog: MatDialog) {
               }

  async ngOnInit() {
    this.gameType = this.signChange == undefined ? 'normal' : 'video';
    await this.wordsService.getWordsData();
    this.paintWords();
  }
  
  ngAfterViewInit(): void {
    this.keepFocus();
  }

  keepFocus() {
    let elem = document.getElementById(`row-${this.activeRow}-letter-${this.activeCol}`);
    elem?.focus()
  }

  ngOnChanges(changes: SimpleChanges) {
    let currValue: SignChange = changes?.['signChange']?.['currentValue'];
    
    if (!currValue) return

    let element = document.getElementById(`row-${this.activeRow}-letter-${currValue.letter_index}`);

    this.onDigitInput(element, currValue.sign, currValue.letter_index)
  }

  isActive(rowIndex: number) {
    return rowIndex == this.activeRow;
  }

  paintWords() {
    for (let i = 0; i < 6; i++) {
      if (this.board[i].join("") != "")
        this.paintGridAndKeyboard(this.board[i].join(""), this.wordsService.wordsData.currentWord, i);
    }
  }

  paintGridAndKeyboard(tentativeWord: string, chosenWord: string, rowIdx: number) {
    const choosenWordArray = chosenWord.split('');
    const tentativeWordArray = tentativeWord.split('');
  
    for (let i = 0; i < 5; i++) {
      const input = document.getElementById(`row-${rowIdx}-letter-${i}`);
      const kbdLetter = document.getElementById(`kbd-${tentativeWord[i].toUpperCase()}`);
  
      const isGreen = kbdLetter?.style.backgroundColor === 'green';
  
      if (tentativeWord[i] === chosenWord[i]) {
        choosenWordArray[i] = '-';
        tentativeWordArray[i] = '-';
  
        this.setElementBackgroundColor(input, 'green');
        this.setElementBackgroundColor(kbdLetter, 'green');
      } else {
        tentativeWordArray[i] = '-';
  
        this.setElementBackgroundColor(input, 'red');
        this.setElementBackgroundColor(kbdLetter, isGreen ? 'green' : 'red');
      }
    }
  
    for (let i = 0; i < 5; i++) {
      const input = document.getElementById(`row-${rowIdx}-letter-${i}`);
      const kbdLetter = document.getElementById(`kbd-${tentativeWord[i].toUpperCase()}`);
      const isGreen = kbdLetter?.style.backgroundColor === 'green';
  
      if (!isGreen && choosenWordArray.includes(tentativeWord[i])) {
        this.setElementBackgroundColor(input, '#96950a');
        this.setElementBackgroundColor(kbdLetter, isGreen ? 'green' : '#96950a');
        let idx = choosenWordArray.indexOf(tentativeWord[i]);
        choosenWordArray[idx] = '-';
        tentativeWordArray[i] = '-';
      }
    }
  }
  
  private setElementBackgroundColor(element: HTMLElement | null, color: string) {
    if (element) {
      this.renderer.setStyle(element, 'background-color', color);
    }
  }
  

  validGuess(word: string[], rowIdx: number) {
    let tentativeWord = word.join("").toLowerCase();
    let choosenWord = this.wordsService.wordsData.currentWord;

    let isWordInDB = this.wordsService.wordsData.getWordsSet().has(tentativeWord);

    if (tentativeWord.length < choosenWord.length || !isWordInDB) {
      this.animationState = isWordInDB ? 'hidden' : 'visible';
      return false;
    }
  
    this.paintGridAndKeyboard(tentativeWord, choosenWord, this.activeRow)

    return true;

  }

  onKeyPress(event: any) {
    return false
  }

  isCorrect(validGuess: boolean) {

    if (!validGuess) {
      document.getElementById(`row-${this.activeRow}-letter-${this.activeCol}`)?.focus();
      return
    }

    let guess = this.board[this.activeRow].join("").toLowerCase();
    let choosenWord = this.wordsService.getCurrentWord();
    
    this.activeRow += 1;
    this.activeCol = 0;
    let won = guess === choosenWord;

    this.try.emit({activeRow: this.activeRow, gameOver: 0, tries: []});
    if (won) {
      this.activeRow =  99;
    }
    
    if (this.activeRow > 5) {
      this.openStreakModal();
      this.try.emit({activeRow: this.activeRow, gameOver: 1, tries: []});
      this.play.emit(won);
    }


    let elem = document.getElementById(`row-${this.activeRow}-letter-${this.activeCol}`);


    if (elem) {
      elem!.contentEditable = 'true';
    }
    elem?.focus()
  }

  openStreakModal() {
    const dialogRef = this.dialog.open(StreakModalComponent, {
      width: '70vh',
      minHeight: 'calc(25vh - 90px)',
      height : 'auto',
      maxWidth: '90vw',
      data: {
        type: this.gameType
      }
    },);

    dialogRef.afterClosed().subscribe(result => {
    });
  }

  changeColIndex(newIndex: number) {
    if (newIndex >= 0 && newIndex <= 4) {
      this.activeCol = newIndex;
      this.nextLetter.emit(this.activeCol) 
    }
  }

  onKeyboardClick(event: any, value: string) {
    if (this.activeRow > 5)
      return 
      
    let element = document.getElementById(`row-${this.activeRow}-letter-${this.activeCol}`);
    element?.focus();
    this.onDigitInput(element, value, this.activeCol);
  }
  
  onDigitInput(event: any, value: string, i: number) { 
    if (event == null) {
      return
    }

    this.animationState = 'hidden';
    let element: HTMLElement | null = null;
    let previousElement = event?.srcElement ? event.srcElement.previousElementSibling : event.previousElementSibling;
    let nextElement = event?.srcElement ? event.srcElement.nextElementSibling : event.nextElementSibling;
    let content = event?.srcElement ? (event.srcElement as HTMLElement).textContent : (event as HTMLElement).textContent;
    let key = event?.key ? event.key : value;
  
    let searchKey = value ? value : event.code
  
    switch(searchKey as string) {
      case 'Enter': case 'Enter': case 'enter':
        let isValidGuess: boolean = this.validGuess(this.board[this.activeRow], this.activeRow);
        this.isCorrect(isValidGuess)
        this.nextLetter.emit(this.activeCol);
        break;
      case 'Backspace': case 'Deletar': case 'deletar':
        this.animationState = 'hidden';
        let shouldMoveCursor: boolean = content === '' ;
        element = shouldMoveCursor ? previousElement : null;
          
        this.board[this.activeRow][i] = '';
          
        if (event?.srcElement) {
          (event.srcElement as HTMLElement).textContent = '';
          if (shouldMoveCursor) {
            this.activeCol -= 1;
            this.changeColIndex(i-1);
          }
        }
        else {
          (event as HTMLElement).textContent = '';
            
          if (this.activeCol > 0 && shouldMoveCursor) {
            this.activeCol -= 1;
            this.changeColIndex(i - 1);
            (previousElement as HTMLElement).textContent = '';
            this.board[this.activeRow][this.activeCol] = '';
          }
        }
  
        break;
      case 'ArrowLeft': case 'ArrowDown':
        element = previousElement;
        this.activeCol = i-1;
        this.changeColIndex(i-1);
        break;
      case 'ArrowRight': case 'ArrowUp': case 'Space':
        element = nextElement;
        this.activeCol = i+1;
        this.changeColIndex(i+1);
        break;
      default:
        element = nextElement;
        if (key.match(/^[a-zA-Z]{1}$/g) != null) {
          if (event?.srcElement) {
            (event.srcElement as HTMLElement).textContent = key.toUpperCase();
            this.board[this.activeRow][i] = key
          }
          else {
            (event as HTMLElement).textContent = value;
            this.board[this.activeRow][i] = value
          }
  
          this.changeColIndex(i+1);
        }
        break;
      }
  
    this.keepFocus()
    if (element != null) {
      element.focus();
    }
  }
  
  
}
