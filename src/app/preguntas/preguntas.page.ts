import { Component, OnInit, ViewChild } from '@angular/core';
import { CeciTalkService } from '../service/ceci-talk.service';
import { Howl } from 'howler';
import { Preferences } from '@capacitor/preferences';
import { Clipboard } from '@capacitor/clipboard';
import { environment } from 'src/environments/environment.prod';
import { IonModal  } from '@ionic/angular';


@Component({
  selector: 'app-preguntas',
  templateUrl: './preguntas.page.html',
  styleUrls: ['./preguntas.page.scss'],
})
export class PreguntasPage implements OnInit {
  @ViewChild(IonModal) modal: IonModal;

  private sounds: { [key: string]: Howl } = {};
  isPlaying = false;
  selectedButton: string | null = null;

  constructor(
    private ceciTalkService: CeciTalkService,
  ) {
    this.setupSounds();
  }

  setupSounds() {
    // Agrega tus archivos de audio junto con sus nombres clave en el objeto 'sounds'
    this.sounds['0'] = new Howl({ src: ['../../assets/audios/0Prespg.mp3'] });
    this.sounds['1pg_donde'] = new Howl({
      src: ['../../assets/audios/1pg_donde.mp3'],
    });
    this.sounds['2pg_transferencia'] = new Howl({
      src: ['../../assets/audios/2pg_transfencia.mp3'],
    });
    this.sounds['3pg_verdenuevo'] = new Howl({
      src: ['../../assets/audios/3pg_verdenuevo.mp3'],
    });
    this.sounds['4'] = new Howl({ src: ['../../assets/audios/4GIRA_pg.mp3'] });
    this.sounds['5'] = new Howl({
      src: ['../../assets/audios/5importancia_PG.mp3'],
    });
    this.sounds['6'] = new Howl({
      src: ['../../assets/audios/6que hace_pg.mp3'],
    });
    this.sounds['7'] = new Howl({
      src: ['../../assets/audios/7comoReciamigo_PG.mp3'],
    });
    this.sounds['8'] = new Howl({
      src: ['../../assets/audios/8iniciativa_PG.mp3'],
    });
    this.sounds['9'] = new Howl({
      src: ['../../assets/audios/10volveraVer_PG.mp3'],
    });

    // Configura eventos 'end' para cada instancia de Howl
    for (const key in this.sounds) {
      if (this.sounds.hasOwnProperty(key)) {
        const sound = this.sounds[key];
        sound.on('end', () => {
          console.log(`El audio ${key} ha terminado de reproducirse.`);
          // realizar acciones cuando termine la reproducción
          this.CeCiTalk(key);
          this.isPlaying = false; // Marca que la reproducción ha terminado
        });
      }
    }
  }

  playAudio(audioKey: string) {
    // Verifica si ya se está reproduciendo un audio
    if (this.isPlaying) {
      return; // No hagas nada si ya se está reproduciendo un audio
    }
    // Iniciar la reproducción del audio por su clave
    const sound = this.sounds[audioKey];
    if (sound) {
      this.isPlaying = true;
      this.selectedButton = audioKey; //btn selecionado para reproducir
      sound.play();
    }
  }

  ip: string ;
  port: number = 5000;
  viewSettings: boolean = false;
  //Metodo para reproducir Mp3 de CeCi
  async CeCiTalk(nombreSonido: string) {
      Preferences.set({ key: 'ipDefault', value: this.ip });

      const { value } = await Preferences.get({ key: 'ipDefault' });
      console.log('ipDefault: ', value);

      var fullIp = value + ':' + this.port;

      this.ceciTalkService.reproducirSonido2(nombreSonido, fullIp).subscribe(
        (response) => console.log(response),
        (error) =>{
           console.error('Alerta: ', error)
          this.msj = error;
          this.showModalError = true;
     }
      );
  }


  async ngOnInit() {
    const { value } = await Preferences.get({ key: 'ipDefault' });
      console.log('ipDefault: ', value);
      if (value) {
        return this.ip = value!;
      } else {
        return this.ip = environment.defaultIP;
      }
  }

  msj: any;
  showModalError: boolean = false;
  isToastOpen = false;
   //tostada de copiado al portapapeles
   isToastOpenClipBoard = false;
   setOpenToastClipBoard(isOpen: boolean) {
     this.isToastOpen = isOpen;
   }

   // tostada de error al copiar al portapapeles
   isToastOpenClipBoardError = false;
   setOpenToastClipBoardError(isOpen: boolean) {
     this.isToastOpen = isOpen;
   }

   // Metodo para copiar al portapapeles
   copiarAlPortapapeles() {
     if (Clipboard.write) {
       try {
         //Para copiar en la app
         Clipboard.write({
           string: JSON.stringify(this.msj),
         });
         //Para cerrar el mensaje
         setTimeout(() => {
           this.msj = null;
           this.cancel();
         }, 1000);
         this.isToastOpenClipBoard = true;
       } catch (error) {
         console.error('Error al copiar al portapapeles: ', error);
         this.setOpenToastClipBoardError(true);
       }
     } else {
       //Para copiar en el navegador
       try {
         navigator.clipboard.writeText(JSON.stringify(this.msj));
         //Para cerrar el mensaje
         setTimeout(() => {
           this.msj = null;
           this.cancel();
         }, 1000);
         this.isToastOpenClipBoard = true;
       } catch (error) {
         console.error('Error al copiar al portapapeles del navegador: ', error);
         this.setOpenToastClipBoardError(true);
       }
     }
   }

easterEggClickCount = 0;
//Muestra configuraciones de cnx
handleEasterEggClick() {
  this.easterEggClickCount++;

  if (this.easterEggClickCount === 5) {
    this.showSecretButton = true;
    this.easterEggClickCount = 0;
  }
}
showSecretButton = false;

toggleActions() {
  this.showSecretButton = !this.showSecretButton;
  this.viewSettings = !this.viewSettings;
}

cancel() {
  this.modal.dismiss(null, 'cancel');
  this.showModalError = false;
}
}
