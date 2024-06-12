import { Injectable } from '@angular/core';
import { Feature, Graticule, Map, View } from 'ol';
import OSM from 'ol/source/OSM';
import { defaults } from 'ol/interaction';
import { transform } from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import Stroke from 'ol/style/Stroke';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Point } from 'ol/geom';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import { FeatureLike } from 'ol/Feature';
import { MobilePositionService } from './mobile-position.service';

@Injectable({
  providedIn: 'root'
})
export class OpenLayerService {
  readonly RESOLUTION_LIM_MP = 0.5; // in meters per pixels
  private _map: Map;
  private _projection = 'EPSG:3857';
  private _sourceProjection = 'EPSG:4326'; // this is wgs84, the projection used in all the backend
  private _center: [number, number] = [5.882415, 43.101914];
  private _mobileLayer: any;
  private _mobileFeature!: Feature;

  private _image = new Image(100, 100);

  // Mobile related properties :
  private _heading_rad = 0;
  private _mobileLength_m = 8.0;

  constructor(private positionService: MobilePositionService) {
    this._map = new Map({
      // Ici on peut ajouter d'autres layers comme la connexion à GeoServer.
      layers: [new TileLayer({
        source: new OSM({
          wrapX: false,
        }),
      }),
      new Graticule({
        // the style to use for the lines, optional.
        strokeStyle: new Stroke({
          color: 'rgba(255,120,0,0.9)',
          width: 2,
          lineDash: [0.5, 4],
        }),
        showLabels: true,
        wrapX: false,
        // Permet d'afficher plus ou moins de rectangles, voir la doc.
        intervals: [90, 45, 30, 20, 10, 5, 2, 1, 30 / 60, 20 / 60, 10 / 60, 5 / 60, 2 / 60, 1 / 60, 30 / 3600, 20 / 3600, 10 / 3600, 5 / 3600, 2 / 3600, 1 / 3600, 1 / 7200]
      }),],
      view: new View({
        projection: this._projection,
        center: transform(this._center, this._sourceProjection, this._projection),
        zoom: 10,
        minZoom: 3,
        maxZoom: 27
      }),
      controls: [],
      interactions: defaults({ doubleClickZoom: false })
    });

    // Ici on crée un objet image dans lequel on charge l'icone de notre bateau. Cet objet ne va servir qu'à une seule chose : 
    // connaitre la taille  en pixels de l'icone pour pouvoir la mettre à l'échelle (voir la variable imageResolution dans computeMarkerStyle).
    this._image.src = 'assets/ownship.png';

    this.addMobile();

    this.positionService.position$.subscribe((position) => {
      console.log('position', position);
      this._heading_rad = (position.heading * Math.PI) / 180;
      const coords = transform([position.lon, position.lat], this._sourceProjection, this._projection);
      this._mobileFeature.setGeometry(new Point(coords));
      this._map.render();
    });
  }

  get map(): Map {
    return this._map;
  }
  addRosace() {
    //todo
  }
  addMobile() {
    this._mobileFeature = new Feature({
      geometry: new Point([])
    });
    this._mobileLayer = new VectorLayer({
      zIndex: 2,
      source: new VectorSource({
        features: [this._mobileFeature]
      }),
      style: (feature: FeatureLike, resolution: number): Array<Style> => {
        return this.computeMarkerStyle(feature, resolution);
      }
    });
    this._map.addLayer(this._mobileLayer);
  }

  private computeMarkerStyle(feature: FeatureLike, resolution: number): Array<Style> {
    // TODO : Attention resolution est dans l'unité de la carte. Donc va changer en fonction de la projection.
    // Comme on considère qu'on est en WebMercator, on fait l'hypothèse que résoltuion est en mètres.
    // si on veut rendre l'appli robuste au changement de projection, il faudrait ici convertir resolution en mètre quelque soit la
    // projection de la carte... Ce serait faisable puisqu'on a la view via le MapService.

    const scale = 0.02;
    const fullStyle = [];
    // Ici on crée l'icone de notre bateau. On veut qu'elle soit orientée en fonction de la direction du bateau.
    // on veut qu'il ait une certaine taille quand le niveau de zoom est faible, puis une taille équivalente à celle du bateau
    // quand le niveau de zoom devient fort.
    const ownship: Style = new Style({
      image: new Icon({
        src: 'assets/ownship.png',
        scale,
        rotation: this._heading_rad
      })
    });
    const imageResolution: number = this._mobileLength_m / this._image.naturalHeight / scale;
    if (resolution < this.RESOLUTION_LIM_MP) {
      ownship.getImage()?.setScale((scale * imageResolution) / resolution);
    } else {
      ownship.getImage()?.setScale(scale);
    }
    fullStyle.push(ownship);

    // rosace : Ici on crée la rosace. On veut qu'elle soit toujours orientée vers le nord, et on veut qu'elle ait une taille
    // toujours égale à 4 fois celles du bateau.
    const rosaceSizePx = 100;
    const ownshipSizePx = this._image.naturalHeight * scale;
    const rosace: Style = new Style({
      image: new Icon({
        src: 'assets/rosace.svg',
        scale: 4 * (ownshipSizePx / rosaceSizePx),
        rotation: 0
      })
    });

    fullStyle.push(rosace);
    return fullStyle;
  }
}
