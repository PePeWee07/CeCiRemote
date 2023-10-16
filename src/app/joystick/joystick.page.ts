import { ReadQuestionService } from './../service/read-question.service';
import { Component, AfterViewInit, OnInit, ViewChild } from '@angular/core';

import * as ROSLIB from 'roslib';
import * as nipplejs from 'nipplejs';

import { ModalController } from '@ionic/angular';
import { CeciTalkService } from '../service/ceci-talk.service';
import { IonModal } from '@ionic/angular';
import { AlertController } from '@ionic/angular';

import { ModalSettingsComponent } from '../modal-settings/modal-settings.component';

import { Clipboard } from '@capacitor/clipboard';

@Component({
  selector: 'app-joystick',
  templateUrl: './joystick.page.html',
  styleUrls: ['./joystick.page.scss'],
})
export class JoystickPage implements AfterViewInit, OnInit {
  @ViewChild(IonModal) modal: IonModal | undefined;
  public alertButtons = ['OK'];

  viewSettings: boolean = false;
  viewJoystick2: boolean = false;

  //variables para la conexion Ros
  connected = false;
  connecting: boolean = false; //sniper de carga network
  ros: ROSLIB.Ros | null = null;
  ipRobot: string = '172.16.71.84';
  port: string = '9090';
  wsAddress: string | null = 'ws://localhost:9090';
  topic: ROSLIB.Topic | null = null;
  topicSound: ROSLIB.Topic | null = null;
  batteryTopic: ROSLIB.Topic | null = null;
  message: ROSLIB.Message | null = null;

  //variables para el joystick
  linearSpeed: number = 0.0;
  angularSpeed: number = 0.0;
  managerJoystick: any;
  maxLinear: number = 0.08;
  maxAngular: number = 0.1;
  optionsJoystick: nipplejs.JoystickManagerOptions = {};
  isJoystickFollow: boolean = false;

  constructor(
    private clipboard: Clipboard,
    private alertController: AlertController
  ) {}

  // Metodo para leer pregunta
  // readQuestion(nombreSonido: string, texto?: string) {
  //   if (texto) {
  //     const utterance = new SpeechSynthesisUtterance(texto);
  //     utterance.onend = () => {
  //       this.CeCiTalk(nombreSonido);
  //     };
  //     speechSynthesis.speak(utterance);
  //   }

  // }

  // //Metodo para reproducir Mp3 de CeCi
  // CeCiTalk(nombreSonido: string) {
  //   this.ceciTalkService.reproducirSonido2(nombreSonido)
  //   .subscribe(
  //     response => console.log(response), // Maneja la respuesta del servidor
  //     error => console.error("Alerta: ",error) // Maneja cualquier error
  //   );
  // }

  ngOnInit() {}

  // Metodo para renderizar el joystick
  ngAfterViewInit(): void {
    //configuracion del joystick
    this.optionsJoystick = {
      zone: document.getElementById('joystick')!,
      mode: 'static',
      position: { left: '50%', top: '50%', bottom: '50%', right: '50%' },
      color: 'blue',
      catchDistance: 150,
      follow: this.isJoystickFollow,
      size: 100,
      threshold: 0.01,
    };

    //crea el joystick
    this.managerJoystick = nipplejs.create(this.optionsJoystick);

    // Manejador para el evento 'move' del joystick
    this.managerJoystick.on('move', (_event: any, nipple: any) => {
      // Calcular velocidades en función de la posición del joystick
      this.linearSpeed = Math.sin(nipple.angle.radian) * this.maxLinear;
      this.angularSpeed = -Math.cos(nipple.angle.radian) * this.maxAngular;

      console.log(
        `linearSpeed: ${this.linearSpeed}, angularSpeed: ${this.angularSpeed}, maxLinear: ${this.maxLinear}, maxAngular: ${this.maxAngular}`
      );

      this.moveRobot(this.linearSpeed, this.angularSpeed);
    });

    // Manejador para el evento 'end' del joystick velocidades en cero cuando se suelta el joystick
    this.managerJoystick.on('end', () => {
      this.linearSpeed = 0.0;
      this.angularSpeed = 0.0;
      this.moveRobot(this.linearSpeed, this.angularSpeed);
    });
  }

  //Tostada para validaciones de campo de velocidades de Joystick
  isToastOpen = false;
  setOpen(isOpen: boolean) {
    this.isToastOpen = isOpen;
  }

  // tostada para confirmacion de actualizacion de joystick
  setOpen2(isOpen: boolean) {
    this.isToastOpen = isOpen;
  }

  // Metodo para actualizar configuracion de joystick
  configJoystick() {
    // if (this.optionsJoystick.size! >= 201 || this.optionsJoystick.size! <= 99) {
    //   this.setOpen(true);
    //   this.optionsJoystick.size = 100;
    // } else {
    this.managerJoystick.destroy();

    console.log(this.optionsJoystick);

    this.managerJoystick = nipplejs.create(this.optionsJoystick);
    this.setOpen2(true);

    // Manejador para el evento 'move' del joystick
    this.managerJoystick.on('move', (_event: any, nipple: any) => {
      // Calcular velocidades en función de la posición del joystick
      this.linearSpeed = Math.sin(nipple.angle.radian) * this.maxLinear;
      this.angularSpeed = -Math.cos(nipple.angle.radian) * this.maxAngular;

      console.log(
        `linearSpeed: ${this.linearSpeed}, angularSpeed: ${this.angularSpeed}, maxLinear: ${this.maxLinear}, maxAngular: ${this.maxAngular}`
      );

      this.moveRobot(this.linearSpeed, this.angularSpeed);
    });

    // Manejador para el evento 'end' del joystick velocidades en cero cuando se suelta el joystick
    this.managerJoystick.on('end', () => {
      this.linearSpeed = 0.0;
      this.angularSpeed = 0.0;
      this.moveRobot(this.linearSpeed, this.angularSpeed);
    });
    // }
  }

  // Método para mover el robot
  moveRobot(linear: number, angular: number) {
    var twist = new ROSLIB.Message({
      linear: {
        x: linear,
        y: 0.0,
        z: 0.0,
      },
      angular: {
        x: 0.0,
        y: 0.0,
        z: angular,
      },
    });
    if (this.topic) {
      this.topic!.publish(twist);
    } else {
      console.log('Topic not set, you neeed to connect to ROSBridge first.');
    }
  }

  msj: any;
  //conectar a ROSBridge
  async connect() {
    console.log('connect to ROSBridge ....');
    // var newWsAddress = 'ws://' + this.ipRobot + ':' + this.port;
    var newWsAddress = this.ipRobot;

    if (!this.ipRobot) {
      const alert = await this.alertController.create({
        header: 'Alert',
        message: 'Se requiere dirección IP!',
        buttons: ['OK'],
      });

      await alert.present();
    } else if (!this.port) {
      const alert = await this.alertController.create({
        header: 'Alert',
        message: 'Se requiere puerto!',
        buttons: ['OK'],
      });

      await alert.present();
    } else {
      this.connecting = true;
      this.wsAddress = newWsAddress;

      try {
        this.ros = new ROSLIB.Ros({
          url: this.wsAddress,
        });

        this.ros.on('connection', () => {
          console.log('Connected!');

          this.connected = true;
          this.setTopic();
          this.reproducirSonido(6);
          this.connecting = false;

          this.msj = 'Conectado';
        });

        this.ros.on('error', async (error) => {
          console.log('Error connecting to websocket server: ', error);
          this.msj = error;

          const alert = await this.alertController.create({
            header: 'Error',
            subHeader: 'Error al conectar',
            message: 'Compruebe si IP y Puerto son correctos.',
            buttons: ['OK'],
          });

          await alert.present();

          this.connected = false;
          this.connecting = false;
        });

        this.ros.on('close', () => {
          console.log('Connection to websocket server closed.');
          this.connected = false;
          this.connecting = false;
        });
      } catch (error: any) {
        console.log('Error al conectar: ', error);
        this.msj = error;
        this.connecting = false;
      }
    }
  }

  //desconectar de ROSBridge
  disconnect(): void {
    if (this.ros) {
      this.reproducirSonido(5);
      this.ros.close();
      this.batteryTopic!.unsubscribe();
      console.log('Disconnected from ROSBridge.');
    }
  }

  // Método para establecer el topic
  setTopic(): void {
    if (this.ros) {
      this.topic = new ROSLIB.Topic({
        ros: this.ros,
        name: '/turtle1/cmd_vel',
        messageType: 'geometry_msgs/Twist',
      });

      // Suscribirse al topic de velocidad
      // this.topic = new ROSLIB.Topic({
      //   ros: this.ros,
      //   name: '/mobile_base/commands/velocity',
      //   messageType: 'geometry_msgs/Twist',
      // });

      // Suscribirse al topic del pitido
      this.topicSound = new ROSLIB.Topic({
        ros: this.ros,
        name: '/mobile_base/commands/sound',
        messageType: 'kobuki_msgs/Sound',
      });

      // Suscribirse al topic de la batería
      this.batteryTopic = new ROSLIB.Topic({
        ros: this.ros,
        name: '/mobile_base/events/power_system',
        messageType: 'kobuki_msgs/PowerSystemEvent',
      });

      // Registra un callback para manejar los eventos de la batería
      this.batteryTopic.subscribe((message: any) => {
        const event = message.event; //estado de la batería
        console.log(event);

        // valores de los eventos del sistema de energía
        const UNPLUGGED = 0;
        const PLUGGED_TO_ADAPTER = 1;
        const PLUGGED_TO_DOCKBASE = 2;
        const CHARGE_COMPLETED = 3;
        const BATTERY_LOW = 4;
        const BATTERY_CRITICAL = 5;

        // mensajes de eventos del sistema de energía
        if (event === BATTERY_LOW) {
          console.log('¡Batería baja!');
        } else if (event === BATTERY_CRITICAL) {
          console.log('¡Batería críticamente baja!');
        } else if (event === UNPLUGGED) {
          // robot desenchufado
          console.log('Robot desenchufado');
        } else if (event === PLUGGED_TO_ADAPTER) {
          // enchufado a un adaptador
          console.log('Robot enchufado a un adaptador');
        } else if (event === PLUGGED_TO_DOCKBASE) {
          // el robot se enchufa a la base de acoplamiento
          console.log('Robot enchufado a la base de acoplamiento');
        } else if (event === CHARGE_COMPLETED) {
          // batería se completa
          console.log('Carga de batería completada');
        }
      });

      console.log('Topic sets');
    } else {
      console.log('Topic not set');
    }
  }

  // Metodo de sonido al coneccion exitosa (pitidos del robot)
  reproducirSonido(tipoSonido: number): void {
    const soundMessage = new ROSLIB.Message({
      value: tipoSonido, // el tipoSonido corresponde al tipo de sonido que deseas reproducir
    });

    // Publica el mensaje en el tópico de sonido
    if (this.topicSound) {
      this.topicSound.publish(soundMessage);
    } else {
      console.log('Topic sound no set');
    }
  }

  // Método para avanzar
  goForward(): void {
    if (this.topic) {
      this.message = new ROSLIB.Message({
        linear: {
          x: this.maxLinear,
          y: 0,
          z: 0,
        },
        angular: {
          x: 0,
          y: 0,
          z: 0,
        },
      });
      this.topic.publish(this.message);
      console.log('Sent Forward command.');
    } else {
      console.log('Topic move no set');
    }
  }

  // Método para girar a la izquierda
  goLeft(): void {
    if (this.topic) {
      this.message = new ROSLIB.Message({
        linear: {
          x: this.maxLinear,
          y: 0,
          z: 0,
        },
        angular: {
          x: 0,
          y: 0,
          z: this.maxAngular,
        },
      });
      this.topic!.publish(this.message);
      console.log('Sent Left command.');
    } else {
      console.log('Topic move no set');
    }
  }

  // Método para girar a la derecha
  goRight(): void {
    if (this.topic) {
      this.message = new ROSLIB.Message({
        linear: {
          x: this.maxLinear,
          y: 0,
          z: 0,
        },
        angular: {
          x: 0,
          y: 0,
          z: -this.maxAngular,
        },
      });
      this.topic!.publish(this.message);
      console.log('Sent Right command.');
    } else {
      console.log('Topic move no set');
    }
  }

  // Método para retroceder
  goBack(): void {
    if (this.topic) {
      this.message = new ROSLIB.Message({
        linear: {
          x: -this.maxLinear,
          y: 0,
          z: 0,
        },
        angular: {
          x: 0,
          y: 0,
          z: 0,
        },
      });
      this.topic!.publish(this.message);
      console.log('Sent Back command.');
    } else {
      console.log('Topic move no set');
    }
  }

  // Método para detener el movimiento
  goStop(): void {
    if (this.topic) {
      this.message = new ROSLIB.Message({
        linear: {
          x: 0,
          y: 0,
          z: 0,
        },
        angular: {
          x: 0,
          y: 0,
          z: 0,
        },
      });
      this.topic.publish(this.message);
      console.log('Sent Stop command.');
    } else {
      console.log('Topic move no set');
    }
  }


  isToastOpenClipBoard = false;
  isToastOpenClipBoardError = false;

  setOpenToastClipBoard(isOpen: boolean) {
    this.isToastOpen = isOpen;
  }
  setOpenToastClipBoardError(isOpen: boolean) {
    this.isToastOpen = isOpen;
  }

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
        }, 1000);
        this.isToastOpenClipBoard = true;
      } catch (error) {
        console.error("Error al copiar al portapapeles: ", error);
        this.isToastOpenClipBoardError = true;
      }

    } else {
      //Para copiar en el navegador
      try {
        navigator.clipboard.writeText(JSON.stringify(this.msj));
        //Para cerrar el mensaje
        setTimeout(() => {
          this.msj = null;
        }, 1000);
        this.isToastOpenClipBoard = true;
      } catch (error) {
        console.error("Error al copiar al portapapeles del navegador: ", error);
      }
    }
  }
}
