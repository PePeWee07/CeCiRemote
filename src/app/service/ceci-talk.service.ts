import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CeciTalkService {

  constructor(private _http: HttpClient) { }

  reproducirSonido2(nombreSonido: string, ip?: string) {
    return this._http.get(`http://${ip}/reproducir_sonido/${nombreSonido}`);
  }

  private showJoystickSubject = new BehaviorSubject<boolean>(false);
  showJoystick$ = this.showJoystickSubject.asObservable();

  setShowJoystick(value: boolean) {
    this.showJoystickSubject.next(value);
  }
  getShowJoystick(): boolean {
    return this.showJoystickSubject.value;
  }

}
