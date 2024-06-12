import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OpenLayerService } from './open-layer.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements AfterViewInit {
  @ViewChild('map', { static: false }) private _mapContainer!: ElementRef;

  title = 'POCCarto';
  constructor(private olService: OpenLayerService) {
  }
  ngAfterViewInit(): void {
    this.olService.map.setTarget(this._mapContainer.nativeElement);
  }
}
