import { AfterViewInit, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { WordsService } from './services/words.service';
import { TimeService } from './services/time.service';
import { LocalStorageService } from './services/local-storage.service';
import { StreakModalComponent } from './modals/streak-modal/streak-modal.component';
import { NavigationEnd, Router } from '@angular/router';
import { GameWordsService } from './services/game-words.service';
import { HowToPlayVideoModalComponent } from './modals/how-to-play-video-modal/how-to-play-video-modal.component';
import { filter } from 'rxjs';
import { DeviceDetectorService } from 'ngx-device-detector';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit{
  title = 'Lermo';

  
  canvas: any;
  videoElement: any;
  context: any;
  hands: any;
  camera: any;
  grid: any;
  landmarkContainer: any;
  clickable: boolean = false;
  streakDialog: any;
  isVideo: boolean = false;
  isNotSupported: boolean = false;
  storageMapper: any = {
    '/': 'video',
    '/video': 'video'
  }

  constructor(public dialog: MatDialog,
              private wordsService: WordsService,
              private timeService: TimeService,
              private gameWordsService: GameWordsService,
              private router : Router,
              private localStorageService: LocalStorageService,
              private deviceService: DeviceDetectorService) { }

  async ngOnInit() {

    setInterval(async () => {
      await this.wordsService.chooseNewWord();
    }, 1000);
  
    this.router.events
    .pipe(
      filter(e => e instanceof NavigationEnd)
      )
      .subscribe((navEnd: any) => {
        this.isVideo = navEnd.urlAfterRedirects.includes('video');
        this.isNotSupported = navEnd.urlAfterRedirects.includes('not-supported')
    });
    
    this.isGameOver();
  }

  onGameOver() {
    if (this.isGameOver()) {
      this.openStreakModal();
    }
  }

  isDesktop() {
    return this.deviceService.isDesktop();
  }

  isGameOver() {
    let GameOver = this.localStorageService.get(this.storageMapper[this.router.url])?.state.gameOver || 0;

    this.clickable = GameOver == 1;

    return GameOver == 1;
  }

  routeToVideoPage() {
    this.router.navigateByUrl('/video');
  }

  routeToNormalPage() {
    this.router.navigateByUrl('/');
  }

  ngAfterViewInit(): void { }

  openStreakModal() {
    this.streakDialog = this.dialog.open(StreakModalComponent, {
      width: '70vh',
      minHeight: 'calc(25vh - 90px)',
      height : 'auto',
      maxWidth: '90vw',
      data: {
        type: this.storageMapper[this.router.url]
      }
    });
  }

  openHowToPlayModal() {
    let modal = this.isVideo ? HowToPlayVideoModalComponent : HowToPlayVideoModalComponent;

    const dialogRef = this.dialog.open(modal, {
      width: '49vh',
      maxWidth: '85vw',
      maxHeight: '90vh',
      minHeight: 'calc(50vh - 180px)',
      height : 'auto',
      panelClass: 'custom-container',
    });
    dialogRef.afterClosed().subscribe(result => {
      let elem = document.getElementById(`row-0-letter-0`);
      elem?.focus()
    });
  }
}
