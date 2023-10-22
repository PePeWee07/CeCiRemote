import { Component, AfterViewInit, OnInit } from '@angular/core';

import * as ROSLIB from 'roslib';
import * as nipplejs from 'nipplejs';

import { AlertController } from '@ionic/angular';

import { Clipboard } from '@capacitor/clipboard';
import { environment } from 'src/environments/environment';
import { Preferences } from '@capacitor/preferences';

@Component({
  selector: 'app-joystick',
  templateUrl: './joystick.page.html',
  styleUrls: ['./joystick.page.scss'],
})
export class JoystickPage implements AfterViewInit, OnInit {
  viewSettings: boolean = false;

  //botones de informacion de velocidad lineal y angular
  alertButtons = [
    {
      text: 'Aceptar',
      handler: () => {
        // Manejar la lógica cuando se hace clic en Aceptar
      }
    },
  ];

  //variables para la conexion Ros
  connected = false;
  connecting: boolean = false; //sniper de carga network
  ros: ROSLIB.Ros | null = null;
  ipRobot: string;
  port: string = '9090';
  topic: ROSLIB.Topic | null = null;
  topicSound: ROSLIB.Topic | null = null;
  message: ROSLIB.Message | null = null;

  //variables para el joystick
  linearSpeed: number = 0.0;
  angularSpeed: number = 0.0;
  managerJoystick: any;
  maxLinear: number = 0.08;
  maxAngular: number = 0.3;
  optionsJoystick: nipplejs.JoystickManagerOptions = {};
  isJoystickFollow: boolean = false;

  constructor(private alertController: AlertController) {}

 async ngOnInit() {
    const { value } = await Preferences.get({ key: 'ipDefault' });
      console.log('ipDefault: ', value);
      if (value) {
        this.ipRobot = value!;
        this.connect();
      } else {
        this.ipRobot = environment.defaultIP;
        this.connect();
      }
  }

  // Metodo para renderizar el joystick
  ngAfterViewInit(): void {
    //configuracion del joystick
    this.optionsJoystick = {
      zone: document.getElementById('joystick')!,
      mode: 'static',
      position: { left: '50%', top: '50%', bottom: '50%', right: '50%' },
      color: 'red',
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
        `linearSpeed: ${this.linearSpeed}, angularSpeed: ${this.angularSpeed},
        maxLinear: ${this.maxLinear}, maxAngular: ${this.maxAngular}`
      );

      this.moveRobot(this.linearSpeed, this.angularSpeed);
    });

    // Manejador para el evento 'end' del joystick velocidades en cero cuando
    // se suelta el joystick
    this.managerJoystick.on('end', () => {
      this.linearSpeed = 0.0;
      this.angularSpeed = 0.0;
      this.moveRobot(this.linearSpeed, this.angularSpeed);
    });
  }

  isToastOpen = false;
  // tostada para confirmacion de actualizacion de joystick
  setOpenUpdateJoystick(isOpen: boolean) {
    this.isToastOpen = isOpen;
  }

  // Metodo para actualizar configuracion de joystick
  async configJoystick() {
    if (!this.maxLinear) {
      const alert = await this.alertController.create({
        header: 'Alert',
        message: 'Se requiere velocidad lineal!',
        buttons: ['OK'],
      });
      await alert.present();
    } else if (!this.maxAngular) {
      const alert = await this.alertController.create({
        header: 'Alert',
        message: 'Se requiere velocidad angular!',
        buttons: ['OK'],
      });
      await alert.present();
    } else {
      this.managerJoystick.destroy();

      console.log(this.optionsJoystick);

      this.managerJoystick = nipplejs.create(this.optionsJoystick);
      this.setOpenUpdateJoystick(true);

      // Manejador para el evento 'move' del joystick
      this.managerJoystick.on('move', (_event: any, nipple: any) => {
        // Calcular velocidades en función de la posición del joystick
        this.linearSpeed = Math.sin(nipple.angle.radian) * this.maxLinear;
        this.angularSpeed = -Math.cos(nipple.angle.radian) * this.maxAngular;

        console.log(
          `linearSpeed: ${this.linearSpeed}, angularSpeed: ${this.angularSpeed},
        maxLinear: ${this.maxLinear}, maxAngular: ${this.maxAngular}`
        );

        this.moveRobot(this.linearSpeed, this.angularSpeed);
      });

      // Manejador para el evento 'end' del joystick velocidades en cero cuando se
      // suelta el joystick
      this.managerJoystick.on('end', () => {
        this.linearSpeed = 0.0;
        this.angularSpeed = 0.0;
        this.moveRobot(this.linearSpeed, this.angularSpeed);
      });
    }
  }

  // Método para mover el robot
  async moveRobot(linear: number, angular: number) {
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
      console.log('Topic not set, you need to connect to ROSBridge first.');
    }
  }

  msj: any;
  //conectar a ROSBridge
  async connect() {
    this.msj = null;

    Preferences.set({ key: 'ipDefault', value: this.ipRobot });
    const { value } = await Preferences.get({ key: 'ipDefault' });
    console.log('ipDefault: ', value);

    var newWsAddress = 'ws://' + value + ':' + this.port;
    console.log('newWsAddress: ', newWsAddress);


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

      try {
        this.ros = new ROSLIB.Ros({
          url: newWsAddress,
        });

        this.ros.on('connection', () => {
          console.log('Connected!');

          this.connected = true;
          this.setTopic();
          this.reproducirSonido(6);
          this.connecting = false;
        });

        this.ros.on('error', async (error) => {
          console.log('Error connecting to websocket server: ', error);
          this.msj = error;

          const alert = await this.alertController.create({
            header: 'Error',
            subHeader: 'Error al conectar',
            message: 'Compruebe si la IP y Puerto son correctos.',
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
      console.log('Desconecatdo de ROSBridge.');
    }
  }

  // Método para establecer el topic
  setTopic(): void {
    if (this.ros) {
      //Suscribirse al topic de velocidad
      this.topic = new ROSLIB.Topic({
        ros: this.ros,
        name: '/mobile_base/commands/velocity',
        messageType: 'geometry_msgs/Twist',
      });

      // Suscribirse al topic del pitido
      this.topicSound = new ROSLIB.Topic({
        ros: this.ros,
        name: '/mobile_base/commands/sound',
        messageType: 'kobuki_msgs/Sound',
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
        }, 1000);
        this.isToastOpenClipBoard = true;
      } catch (error) {
        console.error('Error al copiar al portapapeles del navegador: ', error);
        this.setOpenToastClipBoardError(true);
      }
    }
  }
}
