import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CeciTalkService {

  constructor(private _http: HttpClient) { }

  reproducirSonido2(nombreSonido: string, ip?: string) {
    return this._http.get(`http://${ip}/reproducir_sonido/${nombreSonido}`);
  }

}
