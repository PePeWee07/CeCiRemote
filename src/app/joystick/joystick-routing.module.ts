import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { JoystickPage } from './joystick.page';

const routes: Routes = [
  {
    path: '',
    component: JoystickPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class JoystickPageRoutingModule {}
