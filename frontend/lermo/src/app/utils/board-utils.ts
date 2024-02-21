export function createEmptyBoard(): string[][] {
  let newBoard: string[][] = [];

  for (let i = 0; i < 6; i++) { 
    newBoard.push(['', '', '', '', ''])
  }

  return newBoard;
}
