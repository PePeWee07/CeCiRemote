import { Component, AfterViewInit, OnInit, ViewChild } from '@angular/core';

import * as ROSLIB from 'roslib';
import * as nipplejs from 'nipplejs';

import { AlertController, IonModal  } from '@ionic/angular';

import { Clipboard } from '@capacitor/clipboard';
import { Preferences } from '@capacitor/preferences';
import { environment } from 'src/environments/environment.prod';

@Component({
  selector: 'app-joystick',
  templateUrl: './joystick.page.html',
  styleUrls: ['./joystick.page.scss'],
})
export class JoystickPage implements AfterViewInit, OnInit {
  @ViewChild(IonModal) modal: IonModal;

  cancel() {
    this.modal.dismiss(null, 'cancel');
    this.showModalError = false;
  }

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
  linearSpeed: number = 0.0; // velocidad lineal ya calculada
  angularSpeed: number = 0.0; // velocidad angular ya calculada
  managerJoystick: any;
  maxLinear: number = 0.08;
  maxAngular: number = 0.5;
  optionsJoystick: nipplejs.JoystickManagerOptions = {};
  isJoystickFollow: boolean = false;

  constructor(private alertController: AlertController) {}

 async ngOnInit() {
  // Cargar ip por defecto o la ultima ip usada
    const { value } = await Preferences.get({ key: 'ipDefault' });
      console.log('ipDefault: ', value);
      if (value) {
        this.ipRobot = value!;
        this.connect();
      } else {
        this.ipRobot = environment.defaultIP;
      }
  // cargar las velocidades por defecto o las ultimas velocidades usadas
  const { value:maxLinearStorage } = await Preferences.get({ key: 'maxLinear' })
  const { value:maxAngularStorage } = await Preferences.get({ key: 'maxAngular' })
    console.log('moves: ', maxLinearStorage);
    console.log('moves: ', maxAngularStorage);
    if (maxLinearStorage !== null && maxAngularStorage !== null) {
      this.maxLinear = parseFloat(maxLinearStorage!);
      this.maxAngular = parseFloat(maxAngularStorage!);
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
    this.managerJoystick.on('move', async (_event: any, nipple: any) => {

      // Calcular velocidades en función de la posición del joystick

      Preferences.set({ key: 'maxLinear', value: this.maxLinear.toString() });
      Preferences.set({ key: 'maxAngular', value: this.maxAngular.toString() });

      const { value:maxLinearStorage } = await Preferences.get({ key: 'maxLinear' })
      const { value:maxAngularStorage } = await Preferences.get({ key: 'maxAngular' })

      // Si hay datos guardados en localstroge, los carga
      if (maxLinearStorage !== null && maxAngularStorage !== null) {
        console.log('moves: ', maxLinearStorage);
        console.log('moves: ', maxAngularStorage);
        this.managerJoystick.on('move', (_event: any, nipple: any) => {
          this.linearSpeed = Math.sin(nipple.angle.radian) * parseFloat(maxLinearStorage!);
          this.angularSpeed = -Math.cos(nipple.angle.radian) * parseFloat(maxAngularStorage!);

          this.moveRobot(this.linearSpeed, this.angularSpeed);
        });

        // si no hay datos guardados en localstroge, carga los datos por defecto
      } else {
        this.managerJoystick.on('move', (_event: any, nipple: any) => {
          this.linearSpeed = Math.sin(nipple.angle.radian) * this.maxLinear;
          this.angularSpeed = -Math.cos(nipple.angle.radian) * this.maxAngular;

          this.moveRobot(this.linearSpeed, this.angularSpeed);
        });
      }
      // manda cordenadas velocidades calculadas al topic
      this.moveRobot(this.linearSpeed, this.angularSpeed);
      this.configJoystick();
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

      Preferences.set({ key: 'maxLinear', value: this.maxLinear.toString() });
      Preferences.set({ key: 'maxAngular', value: this.maxAngular.toString() });

      const { value:maxLinearStorage } = await Preferences.get({ key: 'maxLinear' })
      const { value:maxAngularStorage } = await Preferences.get({ key: 'maxAngular' })

      // Si hay datos guardados en localstroge, los carga
      if (maxLinearStorage !== null && maxAngularStorage !== null) {
        console.log('moves: ', maxLinearStorage);
        console.log('moves: ', maxAngularStorage);
        this.managerJoystick.on('move', (_event: any, nipple: any) => {
          this.linearSpeed = Math.sin(nipple.angle.radian) * parseFloat(maxLinearStorage!);
          this.angularSpeed = -Math.cos(nipple.angle.radian) * parseFloat(maxAngularStorage!);

          this.moveRobot(this.linearSpeed, this.angularSpeed);
        });

        // si no hay datos guardados en localstroge, carga los datos por defecto
      } else {
        this.managerJoystick.on('move', (_event: any, nipple: any) => {
          this.linearSpeed = Math.sin(nipple.angle.radian) * this.maxLinear;
          this.angularSpeed = -Math.cos(nipple.angle.radian) * this.maxAngular;

          this.moveRobot(this.linearSpeed, this.angularSpeed);
        });
      }

      // Manejador para el evento 'end' del joystick velocidades en cero cuando se suelta el joystick
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
  showModalError: boolean = false;
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
          this.showModalError = true;

          // const alert = await this.alertController.create({
          //   header: 'Error',
          //   subHeader: 'Error al conectar',
          //   message: 'Compruebe si la IP y Puerto son correctos.',
          //   buttons: ['OK'],
          // });
          // await alert.present();

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
        this.showModalError = true;
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

      // this.topic = new ROSLIB.Topic({
      //   ros: this.ros,
      //   name: '/turtle1/cmd_vel',
      //   messageType: 'geometry_msgs/Twist',
      // });

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


  // Variables de estado
currentSpeed = 0;  // Velocidad actual
maxPositiveSpeed = 0.6; // Límite máximo de velocidad positiva
maxNegativeSpeed = -0.6; // Límite máximo de velocidad negativa
movementTimer: any; // Variable para almacenar el temporizador

// Método para avanzar
goForward(): void {
  if (this.topic) {
    // Incrementa la velocidad al avanzar
    this.currentSpeed += 0.05;

    // Verifica el límite máximo de velocidad positiva
    if (this.currentSpeed > this.maxPositiveSpeed) {
      this.currentSpeed = this.maxPositiveSpeed;
    }

    this.startMovementTimer();
  } else {
    console.log('Topic move not set');
  }
}

// Método para retroceder
goBack(): void {
  if (this.topic) {
    // Reduzca la velocidad al retroceder
    this.currentSpeed -= 0.05;

    // Verifica el límite máximo de velocidad negativa
    if (this.currentSpeed < this.maxNegativeSpeed) {
      this.currentSpeed = this.maxNegativeSpeed;
    }

    this.startMovementTimer();
  } else {
    console.log('Topic move not set');
  }
}

// Método para iniciar el temporizador de movimiento
startMovementTimer(): void {
  // Detén el temporizador lineal si ya está en ejecución
  this.stopMovementTimer();

  // Establece la velocidad angular a cero
  this.currentAngularSpeed = 0;

  // Detén el temporizador angular
  this.stopAngularMovementTimer();

  this.movementTimer = setInterval(() => {
    this.currentSpeed = parseFloat(this.currentSpeed.toFixed(3));
    this.message = new ROSLIB.Message({
      linear: {
        x: this.currentSpeed,
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
    console.log(`Sent Move command with speed: ${this.currentSpeed} m/s`);
  }, 100); // Ajusta el intervalo según tus necesidades
}

// Método para detener el temporizador de movimiento
stopMovementTimer(): void {
  clearInterval(this.movementTimer);
}

 // Variables de estado para el movimiento angular
currentAngularSpeed = 0;  // Velocidad angular actual
maxLeftSpeed = 3; // Límite máximo de velocidad angular en sentido horario
maxRightSpeed = -3; // Límite máximo de velocidad angular en sentido antihorario
angularMovementTimer: any; // Temporizador para el movimiento angular

// Método para girar a la izquierda
goLeft(): void {
  if (this.topic) {
    // Incrementa la velocidad angular en sentido horario
    this.currentAngularSpeed += 0.3;

    // Verifica el límite máximo de velocidad angular en sentido horario
    if (this.currentAngularSpeed > this.maxLeftSpeed) {
      this.currentAngularSpeed = this.maxLeftSpeed;
    }

    this.startAngularMovementTimer();
  } else {
    console.log('Topic move not set');
  }
}

// Método para girar a la derecha
goRight(): void {
  if (this.topic) {
    // Incrementa la velocidad angular en sentido antihorario
    this.currentAngularSpeed -= 0.3;

    // Verifica el límite máximo de velocidad angular en sentido antihorario
    if (this.currentAngularSpeed < this.maxRightSpeed) {
      this.currentAngularSpeed = this.maxRightSpeed;
    }

    this.startAngularMovementTimer();
  } else {
    console.log('Topic move not set');
  }
}

// Método para iniciar el temporizador de movimiento angular
startAngularMovementTimer(): void {
  // Detén el temporizador angular si ya está en ejecución
  this.stopAngularMovementTimer();

  // Establece la velocidad lineal a cero
  this.currentSpeed = 0;

  // Detén el temporizador de movimiento lineal
  this.stopMovementTimer();

  this.angularMovementTimer = setInterval(() => {
    this.currentAngularSpeed = parseFloat(this.currentAngularSpeed.toFixed(3));
    this.message = new ROSLIB.Message({
      linear: {
        x: 0,
        y: 0,
        z: 0,
      },
      angular: {
        x: 0,
        y: 0,
        z: this.currentAngularSpeed,
      },
    });
    this.topic!.publish(this.message);
    console.log(`Sent Angular Movement command with speed: ${this.currentAngularSpeed} rad/s`);
  }, 100); // Ajusta el intervalo según tus necesidades
}

// Método para detener el temporizador de movimiento angular
stopAngularMovementTimer(): void {
  clearInterval(this.angularMovementTimer);
}

// Método para detener el movimiento angular y lineal
goStop(): void {
  clearInterval(this.angularMovementTimer); // Detén el temporizador angular
  clearInterval(this.movementTimer); // Detén el temporizador lineal

  this.currentAngularSpeed = 0; // Establece la velocidad angular a cero
  this.currentSpeed = 0; // Establece la velocidad lineal a cero

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
    console.log('Sent Stop Movement command.');
  } else {
    console.log('Topic move not set');
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
}
