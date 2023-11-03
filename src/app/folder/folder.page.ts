import { CeciTalkService } from './../service/ceci-talk.service';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
})
export class FolderPage implements OnInit {
  public folder!: string;
  private activatedRoute = inject(ActivatedRoute);
  constructor(private ceciTalkService: CeciTalkService, private router: Router) {}

 async ngOnInit() {
    this.folder = this.activatedRoute.snapshot.paramMap.get('id') as string;

      //Capturamos el valor del estado de showJoystick
      const currentShowJoystick = this.ceciTalkService.getShowJoystick(); // Obtener el estado actual
      // Actualizar el texto en el badge
      this.estadoControl = currentShowJoystick ? 'Activado' : 'Desactivado';
  }



  estadoControl: any = false;
// Cambiar el estado de showJoystick
toggleJoystick() {
  const currentShowJoystick = this.ceciTalkService.getShowJoystick(); // Obtener el estado actual
  this.ceciTalkService.setShowJoystick(!currentShowJoystick); // Cambiar el estado
  console.log("Estado de Joystick: ", this.ceciTalkService.getShowJoystick());

  // Actualizar el texto en el badge
  this.estadoControl = currentShowJoystick ? 'Desactivado' : 'Activado';
}


easterEggClickCount = 0;

//Muestra el modo desarrollador despues de 5 toques a CeCi
handleEasterEggClick() {
  this.easterEggClickCount++;

  if (this.easterEggClickCount === 5) {
    this.showSecretButton = true;
    this.easterEggClickCount = 0;
  }
}
showSecretButton = false;

isToastOpenIp = false;
isToastOpenVelocity = false;
// tostada para confirmacion de actualizacion de joystick
setOpen(isOpen: boolean) {
  this.isToastOpenIp = isOpen;
  this.isToastOpenVelocity = isOpen;
}

//Ayuda a resetear las ip para tomar las de por defecto
  async deleteStorageIp(){
    await Preferences.remove({ key: "ipDefault" });
    this.isToastOpenIp = true;
    console.log("Se eliminaron las ip guardadas");
  }

//Ayuda a resetear las ip para tomar las de por defecto
  async deleteStorageVelocity(){
    await Preferences.remove({ key: "maxLinear" });
    await Preferences.remove({ key: "maxAngular" });
    this.isToastOpenVelocity = true;
    console.log("Se eliminaron las velocidades guardadas");
  }

  irAPreguntas() {
    this.router.navigate(['/preguntas']);
  }
}
