import { Component, OnInit } from '@angular/core';


import { ModalController } from '@ionic/angular';

import { NavParams } from '@ionic/angular';

@Component({
  selector: 'app-modal-settings',
  templateUrl: './modal-settings.component.html',
  styleUrls: ['./modal-settings.component.scss'],
})
export class ModalSettingsComponent  implements OnInit {

  ipRobot: string = "";
  port: string = "";

  linearSpeed: number = 1;
  angularSpeed: number = 2;

  saludar: string = "hola desde el modal"


  constructor(private modalCtrl: ModalController, private navParams: NavParams) {
    this.saludar = this.navParams.get('saludar');
    this.ipRobot = this.navParams.get('ipRobot');
    this.port = this.navParams.get('port');
    this.linearSpeed = this.navParams.get('linearSpeed');
    this.angularSpeed = this.navParams.get('angularSpeed');
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    return this.modalCtrl.dismiss(this.ipRobot, 'confirm');
  }

  ngOnInit() {}

}
