import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Position {
  lat: number;
  lon: number;
  heading: number;
}

@Injectable({
  providedIn: 'root'
})
export class MobilePositionService {

  private positionSubject: Subject<Position> = new Subject<Position>();
  private t = 0;
  constructor() {
    setInterval(() => {
      let position = {
        lat: 43.00000 + this.t * 0.0001,
        lon: 5.00000 + this.t * 0.0001,
        heading: this.t / 10.0 % 360
      }
      this.t++;
      this.positionSubject.next(position)
    }, 1000);

  }

  get position$() {
    return this.positionSubject.asObservable();
  }
}
