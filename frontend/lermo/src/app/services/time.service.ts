import { Injectable } from '@angular/core';
import { ITimeDiff } from '../models/time';
import * as moment from 'moment-timezone';

@Injectable({
  providedIn: 'root'
})
export class TimeService {

  constructor() { }

  getTimeDiffCounter(lastDate: number): ITimeDiff {
    let brActualDate = moment().tz('America/Sao_Paulo');
    let lastDateMoment = moment(lastDate).tz('America/Sao_Paulo');

    lastDateMoment.add(1, 'days')

    let hoursDiff = lastDateMoment.diff(brActualDate, 'hours') % 24
    let minDiff   = lastDateMoment.diff(brActualDate, 'minutes') % 60
    let secsDiff  = lastDateMoment.diff(brActualDate, 'seconds') % 60

    let value = {
      hours: this.padZero(hoursDiff).toString(),
      minutes: this.padZero(minDiff).toString(),
      seconds: this.padZero(secsDiff).toString()
    }

    return value
  }


  private padZero(counter: number): string {
    return counter < 10 ? '0' + counter : counter.toString()
  }

  getDayDiff(lastDate: number): number {
    moment.tz.setDefault('America/Sao_Paulo');
    let brTimeNow = moment();
    let lastDateMoment = moment(lastDate);
    return brTimeNow.diff(lastDateMoment, 'days');
  }

  getDatesDifference(firstDate: number, secondDate: number) {
    return Math.abs(firstDate - secondDate) / (1000 * 60 * 60 * 24);
  }
}
