import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { JoystickPageRoutingModule } from './joystick-routing.module';

import { JoystickPage } from './joystick.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    JoystickPageRoutingModule
  ],
  declarations: [JoystickPage]
})
export class JoystickPageModule {}
