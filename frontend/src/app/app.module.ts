import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ViewerComponent } from './viewer/viewer.component';
import { TentativesBoardComponent } from './tentatives-board/tentatives-board.component';
import { TentativeComponent } from './tentative/tentative.component';
import { KeyboardComponent } from './keyboard/keyboard.component';
import { StandardPageComponent } from './standard-page/standard-page.component';
import { HttpClientModule } from '@angular/common/http';
import { BoardComponent } from './board/board.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {MatProgressBarModule} from '@angular/material/progress-bar';

import { MatDialogModule } from '@angular/material/dialog';
import { StreakModalComponent } from './modals/streak-modal/streak-modal.component';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { environment } from 'src/environments/environments';
import { HowToPlayNormalModalComponent } from './modals/how-to-play-normal-modal/how-to-play-normal-modal.component';
import { HowToPlayVideoModalComponent } from './modals/how-to-play-video-modal/how-to-play-video-modal.component';
import { HowToPlayComponent } from './modals/how-to-play/how-to-play.component';
import { NotSupportedPageComponent } from './not-supported-page/not-supported-page.component';


@NgModule({
  declarations: [
    AppComponent,
    ViewerComponent,
    TentativesBoardComponent,
    TentativeComponent,
    KeyboardComponent,
    StandardPageComponent,
    BoardComponent,
    StreakModalComponent,
    HowToPlayNormalModalComponent,
    HowToPlayVideoModalComponent,
    HowToPlayComponent,
    NotSupportedPageComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    provideFirebaseApp(() => initializeApp(environment)),
    provideFirestore(() => getFirestore()),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
