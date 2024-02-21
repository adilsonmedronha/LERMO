export interface IState {
    tries: string[][]
    gameOver: number
    activeRow: number
}

export interface IStatistics {
    games_played: number,
    actual_streak: number,
    best_streak: number,
    games_won: number,
}

export interface IStorage {
    lastTimePlayed: number,
    state: IState
    statistics: IStatistics
}