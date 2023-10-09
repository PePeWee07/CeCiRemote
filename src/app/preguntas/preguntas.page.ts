import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CeciTalkService } from '../service/ceci-talk.service';
import { Howl } from 'howler';

@Component({
  selector: 'app-preguntas',
  templateUrl: './preguntas.page.html',
  styleUrls: ['./preguntas.page.scss'],
})
export class PreguntasPage implements OnInit {

  private sounds: { [key: string]: Howl } = {};
  isPlaying = false;
  selectedButton: string | null = null;


  constructor(private ceciTalkService: CeciTalkService) {
    this.setupSounds();
  }

  setupSounds() {
    // Agrega tus archivos de audio junto con sus nombres clave en el objeto 'sounds'
    this.sounds['0'] = new Howl({ src: ['../../assets/audios/0Prespg.mp3'] });
    this.sounds['1pg_donde'] = new Howl({ src: ['../../assets/audios/1pg_donde.mp3'] });
    this.sounds['2pg_transferencia'] = new Howl({ src: ['../../assets/audios/2pg_transfencia.mp3'] });
    this.sounds['3pg_verdenuevo'] = new Howl({ src: ['../../assets/audios/3pg_verdenuevo.mp3'] });
    this.sounds['4'] = new Howl({ src: ['../../assets/audios/4GIRA_pg.mp3'] });
    this.sounds['5'] = new Howl({ src: ['../../assets/audios/5importancia_PG.mp3'] });
    this.sounds['6'] = new Howl({ src: ['../../assets/audios/6que hace_pg.mp3'] });
    this.sounds['7'] = new Howl({ src: ['../../assets/audios/7comoReciamigo_PG.mp3'] });
    this.sounds['8'] = new Howl({ src: ['../../assets/audios/8iniciativa_PG.mp3'] });
    this.sounds['9'] = new Howl({ src: ['../../assets/audios/9esfuerzos_PG.mp3'] });
    this.sounds['10'] = new Howl({ src: ['../../assets/audios/10volveraVer_PG.mp3'] });

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
      return;  // No hagas nada si ya se está reproduciendo un audio
    }
    // Iniciar la reproducción del audio por su clave
    const sound = this.sounds[audioKey];
    if (sound) {
      this.isPlaying = true;
      this.selectedButton = audioKey; //btn selecionado para reproducir
      sound.play();
    }
  }


  //Metodo para reproducir Mp3 de CeCi
  CeCiTalk(nombreSonido: string) {
    this.ceciTalkService.reproducirSonido2(nombreSonido)
    .subscribe(
      response => console.log(response), // Maneja la respuesta del servidor
      error => console.error("Alerta: ",error) // Maneja cualquier error
    );
  }




  // Metodo para leer pregunta
  readQuestion(nombreSonido: string, texto?: string) {
    if (texto) {
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.onend = () => {
        this.CeCiTalk(nombreSonido);
      };
      speechSynthesis.speak(utterance);
    }

  }

mensaje: string = "No se conecto a FLASK";
  ngOnInit() {
    this.ceciTalkService.getHelloWorldMessage().subscribe(
      (data:any) => {
      this.mensaje = data.message;
    }, (error:any) => {
        console.log("FLak-Error: ", error);
        this.mensaje = error
    }, () => {
      console.log("FLak-Complete");
    }
    );
  }

}
