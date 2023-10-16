import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CeciTalkService {

  constructor(private _http: HttpClient) { }

  Url = 'http://172.16.71.84:5000';


  reproducirSonido2(nombreSonido: string) {
    return this._http.get(`${this.Url}/reproducir_sonido/${nombreSonido}`);
  }

  getHelloWorldMessage() {
    return this._http.get(this.Url+'/hola');
  }

  //Zona de pruebas
  getTest2(url: string) {
    return this._http.get(url);
  }

}
