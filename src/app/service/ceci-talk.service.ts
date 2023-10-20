import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CeciTalkService {

  constructor(private _http: HttpClient) { }

  Url = 'http://172.16.71.84:5000';


  reproducirSonido(nombreSonido: string) {
    return this._http.get(`${this.Url}/reproducir_sonido/${nombreSonido}`);
  }





}
