import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-keyboard',
  templateUrl: './keyboard.component.html',
  styleUrls: ['./keyboard.component.scss']
})
export class KeyboardComponent implements OnInit{

  @Input()
  board!: string[][];
  
  @Input()
  activeRow!: number;

  @Input()
  activeCol!: number;
                     
  firstRow = ['Q','W','E','R','T','Y','U','I','O','P',]
  secondRow = ['A','S','D','F','G','H','J','K','L']
  thirdRow = ['Z','X','C','V','B','N','M']

  ngOnInit(): void { }

}

