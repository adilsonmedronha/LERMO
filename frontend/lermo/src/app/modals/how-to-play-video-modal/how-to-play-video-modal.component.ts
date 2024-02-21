import { Component } from '@angular/core';

@Component({
  selector: 'app-how-to-play-video-modal',
  templateUrl: './how-to-play-video-modal.component.html',
  styleUrls: ['./how-to-play-video-modal.component.scss']
})
export class HowToPlayVideoModalComponent {

  getAlphabet() {
    return 'abcdefghijklmnopqrstuvwxyz'.split('');
  }

}
