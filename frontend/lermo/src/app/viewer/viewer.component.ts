import { Component, OnDestroy } from '@angular/core';
import * as Hands from '@mediapipe/hands';
import * as CameraUtils from '@mediapipe/camera_utils';
import * as DrawingUtils from '@mediapipe/drawing_utils';
import * as _ from 'lodash';
import * as ort from 'onnxruntime-web'
import { WordsService } from '../services/words.service';
import { createEmptyBoard } from '../utils/board-utils';
import { SignChange } from '../models/signChange';
import { IStorage } from '../models/dataStorage';
import { LocalStorageService } from '../services/local-storage.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HowToPlayVideoModalComponent } from '../modals/how-to-play-video-modal/how-to-play-video-modal.component';
import { TimeService } from '../services/time.service';
import { WordsDataService } from '../services/words-data.service';
import { DeviceDetectorService } from 'ngx-device-detector';
import { Router } from '@angular/router';



@Component({
  selector: 'app-viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.scss']
})
export class ViewerComponent implements OnDestroy{
  title = 'Lermo';

  
  canvas: any;
  videoElement: any;
  context: any;
  hands: any;
  camera: any;
  grid: any;
  landmarkContainer: any;
  session!: any;
  predict = '';
  signChange = {} as SignChange;
  predictions: any = {
  };

  letterIdx = 0;
  predictionsCount = 0;
  startTime!: Date;
  dialogRef!: MatDialogRef<HowToPlayVideoModalComponent, any>;


  // Used ON BOARD!
  board: string[][] = createEmptyBoard();
  activeRow: number = 0;

constructor(private wordsService: WordsService,
              private storageService: LocalStorageService,
              private timeService: TimeService,
              private wordsDataService: WordsDataService,
              public dialog: MatDialog,
              private deviceService: DeviceDetectorService,
              private router : Router) { }

  async ngOnInit() {
    this.redirectIfNotDesktop();
    this.openHowToPlayModal();
    await this.wordsService.chooseNewWord();

    let storageData: IStorage = this.storageService.get('video');
    let wordsData = await this.wordsDataService.get();

    
    if (storageData != null) {

      if (storageData.lastTimePlayed == null) {
        storageData.lastTimePlayed = wordsData.current_word_date;
      }

      let lastPlayedMoreThanOneDay = this.timeService.getDayDiff(storageData.lastTimePlayed)
      let dayDiff = this.timeService.getDayDiff(wordsData.current_word_date)

      if (dayDiff >= 1 || lastPlayedMoreThanOneDay >= 1) {
        this.storageService.clearState('video');
        storageData = this.storageService.get('video');
      }
  
      this.board = storageData.state.tries;
      this.activeRow = storageData.state.activeRow;
      this.storageService.set('video', {
        ...storageData,
        lastTimePlayed: wordsData.current_word_date
      })

    }
    else {
      this.storageService.set('video', {
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
          best_streak: 0
        }})
    }
  }

  ngOnDestroy() {
    this.dialogRef.close();
    const inputVideo = document.querySelector('.input_video') as HTMLVideoElement;
    if (inputVideo) {
      const stream = inputVideo.srcObject as MediaStream;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
      inputVideo.srcObject = null;
    }
  
    const outputCanvas = document.querySelector('.output_canvas') as HTMLCanvasElement;
    if (outputCanvas) {
      const stream = outputCanvas.captureStream() as MediaStream;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    }
  }

  openHowToPlayModal() {
    this.dialogRef = this.dialog.open(HowToPlayVideoModalComponent, {
      width: '49vh',
      maxWidth: '85vw',
      maxHeight: '90vh',
      minHeight: 'calc(50vh - 180px)',
      height : 'auto',
      panelClass: 'custom-container',
    });
    this.dialogRef.afterClosed().subscribe(result => {
      let elem = document.getElementById(`row-0-letter-0`);
      elem?.focus()
    });
  }

  nextLetterChange(index: number) {
    
    if (index >= 0 && index <= 4) {
      this.letterIdx = index;
    }
  }

  getAlphabet() {
    return 'abcdefghijklmnopqrstuvwxyz'.split('');
  }

  redirectIfNotDesktop() {
    if (!this.deviceService.isDesktop()) {
      this.router.navigateByUrl('/not-supported');
    }
  }

  async ngAfterViewInit() {
    this.session = await ort.InferenceSession.create('best_model_15-15.onnx')

    this.canvas = document.getElementsByClassName("output_canvas")[0];
    this.context = this.canvas?.getContext('2d');
    this.videoElement = document.getElementsByClassName("input_video")[0];

    let libVal = "@mediapipe"
    let libCat = "hands"
    this.hands = new Hands.Hands({
      locateFile: (file: any) => {
        return `https://cdn.jsdelivr.net/npm/${libVal}/${libCat}/`+ file;
      },});
  
      this.hands.setOptions({
        selfieMode: true,
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    
    this.hands.onResults((results: any) => {
      this.onResults(results, this.session, this.predict);
    });

    if (this.videoElement) {

      this.camera = new CameraUtils.Camera(this.videoElement, {
        onFrame: async () => {
          await this.hands.send({ image: this.videoElement });
        },
        width: 1280,
        height: 720,
      });
      this.camera.start(); 
    }

  }

  async onResults(results: any, session: any, predict: any) {
    let newCanvas: any = document.getElementsByClassName("output_canvas")[0];
    let newContext: any = newCanvas.getContext('2d');
    newContext.save();
    newContext.clearRect(0, 0, newCanvas.width, newCanvas.height);
    newContext.drawImage(
      results.image,
      0,
      0,
      newCanvas.width,
      newCanvas.height
      );

      if (results.multiHandLandmarks.length > 0) {
        for (const landmarks of results.multiHandLandmarks) {
          DrawingUtils.drawConnectors(newContext, landmarks, Hands.HAND_CONNECTIONS, {radius: 0.5});
          DrawingUtils.drawLandmarks(newContext, landmarks, { color: "#FF0000", lineWidth: 1 });

          if (this.activeRow > this.board.length || 
            this.board[this.activeRow].join('').toUpperCase() === this.wordsService.getCurrentWord().toUpperCase()) {
            return;
          }
          
          const xI = landmarks.map((landmark: any) => [Math.min(Math.floor(landmark.x * newCanvas.width), newCanvas.width - 1), Math.min(Math.floor(landmark.y * newCanvas.height), newCanvas.height - 1)]);


          let tempLandmarkList = _.cloneDeep(xI);
          let newList: number[] = [];
          const [baseX, baseY] = tempLandmarkList[0];
          
          for (let i = 0; i < tempLandmarkList.length; i++) {
            let [x, y] = tempLandmarkList[i];
            tempLandmarkList[i] = [x - baseX, y - baseY];
          }
          
          newList = _.flatten(tempLandmarkList);
          const maxVal = Math.max(...newList.map((value: number) => Math.abs(value)));
          newList = newList.map((value: any) => value / maxVal);
          const xINormalized = newList;

          let maxX = Number.MIN_SAFE_INTEGER;
          let minX = Number.MAX_SAFE_INTEGER;
          let maxY = Number.MIN_SAFE_INTEGER;
          let minY = Number.MAX_SAFE_INTEGER;

          for (const [x, y] of xI) {
            maxX = Math.max(maxX, x);
            minX = Math.min(minX, x);
            maxY = Math.max(maxY, y);
            minY = Math.min(minY, y);
          }

          const boxX = minX;
          const boxY = minY;
          const boxWidth = maxX - minX;
          const boxHeight = maxY - minY;

          newContext.beginPath();
          newContext.rect(boxX, boxY, boxWidth, boxHeight);
          newContext.lineWidth = 2;
          newContext.strokeStyle = "red";
          newContext.stroke();
          newContext.closePath();
          
          const data = Float32Array.from(xINormalized);
          const tensor = new ort.Tensor("float32", data, [1,42]);
          const feeds: Record<string, ort.Tensor> = {};
          feeds[session.inputNames[0]] = tensor;

          const outputData = await session.run(feeds);
          let lst = ["A", "B", "C", "D", "Deletar", "E", "Enter", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y"]
          const maxIndex: number = outputData.output.data.reduce((maxIndex: number, currentValue: number, currentIndex: number, array: []) => {
            return currentValue > array[maxIndex] ? currentIndex : maxIndex;
          }, 0);

          if (this.predictionsCount == 0) {
            this.startTime = new Date()
          }
          
          if (this.letterIdx > 4) {
            return;
          }
          
          let predict: string = lst[maxIndex]

          if (this.predictions[predict]) {
            this.predictions[predict] += 1
            this.predictionsCount += 1
          } else {
            this.predictionsCount += 1
            this.predictions[predict] = 1
          }
          
        if (this.predictionsCount === 100) {
          let highest = Object.keys(this.predictions).reduce((x, y) => this.predictions[x] > this.predictions[y] ? x : y)

          this.signChange = {
            letter_index: this.letterIdx,
            sign: highest.toLowerCase()
          }

          this.predictions = {};
          this.predictionsCount = 0;
        }
      }
    } else {
      this.predictions = {};
      this.predictionsCount = 0;
    }

    newContext.restore();
  }


  computeTry(state: any) {
    let videoObj: IStorage = this.storageService.get('video');

    videoObj.state.tries = this.board;
    videoObj.state.gameOver = state.gameOver;
    videoObj.state.activeRow = state.activeRow;

    this.storageService.set('video', videoObj);
  }

  computePlay(won: boolean) {
    let videoObj: IStorage = this.storageService.get('video');
    let oldStatistics = videoObj.statistics

    oldStatistics.games_played = oldStatistics.games_played + 1;
    
    if (won) {
      oldStatistics.games_won = oldStatistics.games_won + 1;
      oldStatistics.actual_streak = oldStatistics.actual_streak + 1;

      oldStatistics.best_streak = oldStatistics.actual_streak > oldStatistics.best_streak ? oldStatistics.actual_streak: oldStatistics.best_streak;
    }
    else {
      oldStatistics.actual_streak = 0;
    }

    videoObj = {...videoObj, statistics: oldStatistics};

    
    this.storageService.set('video', videoObj);
  }
}
