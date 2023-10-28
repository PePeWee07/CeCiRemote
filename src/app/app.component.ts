import { CeciTalkService } from './service/ceci-talk.service';
import { Component } from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  public appPages = [
    { title: 'Inicio', url: '/folder/inbox', icon: 'home' },
    { title: 'Control', url: '/joystick', icon: 'paper-plane' },
    { title: 'Preguntas', url: '/preguntas', icon: 'heart' },
  ];
  // public labels = ['Family', 'Friends', 'Notes', 'Work', 'Travel', 'Reminders'];
  
  public showJoystick = false;

  //recibir notificaciones de cambios en el estado
  constructor(private ceciTalkService: CeciTalkService) {
    this.ceciTalkService.showJoystick$.subscribe((value) => {
      this.showJoystick = value;
    });
  }
}
