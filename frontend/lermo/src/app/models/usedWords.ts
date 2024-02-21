export interface IWordsData {
    current_word: string,
    current_word_date: number,
    used_words: string[]
}


export class WordsData {
    currentWord: string;
    lastUsedDate: number;
    usedWords: string[];
    private wordsSet: Set<string>;

    constructor(currentWord: string, lastUsedDate: number, usedWords: string[], notUsedWords: string[]) {
        this.currentWord = currentWord;
        this.lastUsedDate = lastUsedDate;
        this.usedWords = usedWords;
        this.wordsSet = new Set<string>([...usedWords, ...notUsedWords, this.currentWord]);
    }

    getWordsSet() {
        return this.wordsSet;
    }

    static fromJson(json: IWordsData, words: string[]) {
        return new WordsData(json.current_word, json.current_word_date, json.used_words, words)
    }

    toJson() {
        return {
            current_word: this.currentWord,
            current_word_date: this.lastUsedDate,
            used_words: this.usedWords
        }
    }
}