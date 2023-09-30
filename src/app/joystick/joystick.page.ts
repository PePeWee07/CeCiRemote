import { Component, AfterViewInit, OnInit, ViewChild } from '@angular/core';

import * as ROSLIB from 'roslib';
import * as nipplejs from 'nipplejs';

import { ModalController } from '@ionic/angular';
import { ModalSettingsComponent } from '../modal-settings/modal-settings.component';
import { IonModal } from '@ionic/angular';
import { OverlayEventDetail } from '@ionic/core/components';

@Component({
  selector: 'app-joystick',
  templateUrl: './joystick.page.html',
  styleUrls: ['./joystick.page.scss'],
})
export class JoystickPage implements AfterViewInit, OnInit {
  @ViewChild(IonModal) modal: IonModal | undefined;

  //variables para la conexion Ros
  connected = false;
  ros: ROSLIB.Ros | null = null;
  ipRobot: string = "172.16.71.84";
  port: string = "9090";
  wsAddress: string | null = 'ws://localhost:9090';
  topic: ROSLIB.Topic | null = null;
  topicSound: ROSLIB.Topic | null = null;
  message: ROSLIB.Message | null = null;

  //variables para el joystick
  linearSpeed: number = 0.0;
  angularSpeed: number = 0.0;
  managerJoystick: any;
  maxLinear: number = 1;
  maxAngular: number = 2;
  optionsJoystick: nipplejs.JoystickManagerOptions = {};

  constructor(private modalCtrl: ModalController) {
  }


  messageModal: string = 'This modal example uses triggers to automatically open a modal when the button is clicked.';
  name: string = "";

  cancel() {
    this.modal!.dismiss(null, 'cancel');
  }

  confirm() {
    this.modal!.dismiss(this.name, 'confirm');
  }

  onWillDismiss(event: Event) {
    const ev = event as CustomEvent<OverlayEventDetail<string>>;
    if (ev.detail.role === 'confirm') {
      this.messageModal = `Hello, ${ev.detail.data}!`;
    }
  }

  ngOnInit() {
  }


  ngAfterViewInit(): void {

      //configuracion del joystick
      this.optionsJoystick = {
        zone: document.getElementById('joystick')!, // Elemento HTML de destino
        mode: 'static', // Puedes cambiar esto a 'dynamic' si deseas que el joystick se mueva por toda la pantalla
        // catchDistance: 150,
        // multitouch: true,
        // position: {
        //   left: '50%',
        //   top: '50%'
        // },
        color: 'red', // Color del joystick,
        size: 70, // Tamaño del joystick
      };

      //crea el joystick
      this.managerJoystick = nipplejs.create(this.optionsJoystick);

      // Manejador para el evento 'move' del joystick
      this.managerJoystick.on('move',  (_event:any, nipple:any) => {
        // Calcular velocidades en función de la posición del joystick
        this.linearSpeed = Math.sin(nipple.angle.radian) * this.maxLinear;
        this.angularSpeed = -Math.cos(nipple.angle.radian) * this.maxAngular;

        console.log(`linearSpeed: ${this.linearSpeed}, angularSpeed: ${this.angularSpeed}, maxLinear: ${this.maxLinear}, maxAngular: ${this.maxAngular}`);

        this.moveRobot(this.linearSpeed, this.angularSpeed);
      });

      // Manejador para el evento 'end' del joystick velocidades en cero cuando se suelta el joystick
      this.managerJoystick.on('end',  () => {
        this.linearSpeed = 0.0;
        this.angularSpeed = 0.0;
        this.moveRobot(this.linearSpeed, this.angularSpeed);
      });
  }

  configJoystick() {
    // validación si es necesario
    // Luego, puedes guardar el objeto optionsJoystick en la forma deseada, por ejemplo, en el almacenamiento local
    this.managerJoystick.destroy();

    console.log(this.optionsJoystick);

    this.managerJoystick = nipplejs.create(this.optionsJoystick);

    // localStorage
    localStorage.setItem('optionsJoystick', JSON.stringify(this.optionsJoystick));

    // Manejador para el evento 'move' del joystick
    this.managerJoystick.on('move',  (_event:any, nipple:any) => {
      // Calcular velocidades en función de la posición del joystick
      this.linearSpeed = Math.sin(nipple.angle.radian) * this.maxLinear;
      this.angularSpeed = -Math.cos(nipple.angle.radian) * this.maxAngular;

      console.log(`linearSpeed: ${this.linearSpeed}, angularSpeed: ${this.angularSpeed}, maxLinear: ${this.maxLinear}, maxAngular: ${this.maxAngular}`);

      this.moveRobot(this.linearSpeed, this.angularSpeed);
    });

    // Manejador para el evento 'end' del joystick velocidades en cero cuando se suelta el joystick
    this.managerJoystick.on('end',  () => {
      this.linearSpeed = 0.0;
      this.angularSpeed = 0.0;
      this.moveRobot(this.linearSpeed, this.angularSpeed);
    });
  }


  // ngAfterViewInit(): void {
  //   // Configura las opciones del joystick
  //   const options: nipplejs.JoystickManagerOptions = {
  //     zone: document.getElementById('joystick')!, // Elemento HTML de destino
  //     mode: 'static', // Puedes cambiar esto a 'dynamic' si deseas que el joystick se mueva por toda la pantalla
  //     color: 'gray', // Color del joystick,
  //     size: 170, // Tamaño del joystick
  //   };

  //   // Crea el joystick
  //   const manager = nipplejs.create(options);

  //   // Variables iniciales para velocidades lineal y angular
  //   var linearSpeed = 0.0;
  //   var angularSpeed = 0.0;

  //   //movimientos Lineales (ajustar al gusto)
  //   var maxLinear = 1;
  //   var maxAngular = 2;

  //   // Manejador para el evento 'move' del joystick
  //   manager.on('move',  (_event, nipple) => {
  //     // Calcular velocidades en función de la posición del joystick
  //     linearSpeed = Math.sin(nipple.angle.radian) * maxLinear;
  //     angularSpeed = -Math.cos(nipple.angle.radian) * maxAngular;

  //     this.moveRobot(linearSpeed, angularSpeed);
  //   });

  //   // Manejador para el evento 'end' del joystick velocidades en cero cuando se suelta el joystick
  //   manager.on('end',  () => {
  //     linearSpeed = 0.0;
  //     angularSpeed = 0.0;
  //     this.moveRobot(linearSpeed, angularSpeed);
  //   });

  // }


   // Método para abrir el modal de configuración

  //  async openModal() {
  //   const modal = await this.modalCtrl.create({
  //     component: ModalSettingsComponent,
  //     componentProps: {
  //       ipRobot: this.ipRobot,
  //       port: this.port,
  //       linearSpeed: this.linearSpeed,
  //       angularSpeed: this.angularSpeed,
  //     }
  //   });
  //   modal.present();

  //   const { data, role } = await modal.onWillDismiss();

  //   if (role === 'confirm') {
  //     this.message = `Hello, ${data}!`;
  //   }
  // }


  // Método para mover el robot

  moveRobot(linear: number, angular:number) {
    var twist = new ROSLIB.Message({
        linear: {
            x: linear,
            y: 0.0,
            z: 0.0
        },
        angular: {
            x: 0.0,
            y: 0.0,
            z: angular
        }
    });
    if (this.topic){
      this.topic!.publish(twist);
    }else{
      console.log('Topic not set, you neeed to connect to ROSBridge first.');
    }
  }

//conectar a ROSBridge
  connect(): void {
    console.log('connect to ROSBridge ....');
    var newWsAddress = 'ws://' + this.ipRobot + ':' + this.port;

    if (!this.ipRobot) {
      console.log('IP address is required.');
    } else if (!this.port) {
      console.log('Port is required.');
    } else {
      this.wsAddress = newWsAddress;

      this.ros = new ROSLIB.Ros({
        url: this.wsAddress,
      });

      this.ros.on('connection', () => {
        console.log('Connected!');
        this.connected = true;
        this.setTopic();
        this.reproducirSonido(6)
      });

      this.ros.on('error', (error) => {
        console.log('Error connecting to websocket server: ', error);
      });

      this.ros.on('close', () => {
        console.log('Connection to websocket server closed.');
        this.connected = false;
      });
    }
  }

  //desconectar de ROSBridge
  disconnect(): void {
    if (this.ros) {
      this.reproducirSonido(5)
      this.ros.close();
      console.log('Disconnected from ROSBridge.');
    }
  }


  // Método para establecer el topic
  setTopic(): void {
    if (this.ros) {

      this.topic = new ROSLIB.Topic({
        ros: this.ros,
        name: '/mobile_base/commands/velocity', // Nombre del topic /mobile_base/commands/velocity
        messageType: 'geometry_msgs/Twist',
      });

      this.topicSound = new ROSLIB.Topic({
        ros: this.ros,
        name: '/mobile_base/commands/sound', // Nombre del topic /mobile_base/commands/velocity
        messageType: 'kobuki_msgs/Sound',
      });


      console.log('Topic set to /turtle1/cmd_vel');
    }else{
      console.log('Topic not set');
    }
  }

  // Metodo de sonido al coneccion exitosa
  reproducirSonido(tipoSonido: number): void {
    const soundMessage = new ROSLIB.Message({
      value: tipoSonido  // El valor de tipoSonido corresponde al tipo de sonido que deseas reproducir
    });

    // Publica el mensaje en el tópico de sonido
    if (this.topicSound) {

      this.topicSound.publish(soundMessage);
    }else{
      console.log('Topic sound no set');
    }
  }


  // Método para avanzar
  goForward(): void {
    if (this.topic) {
      this.message = new ROSLIB.Message({
        linear: {
          x: 1,
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
    } else{
      console.log('Topic move no set');
    }
  }

  // Método para girar a la izquierda
  goLeft(): void {
    if(this.topic){
    this.message = new ROSLIB.Message({
      linear: {
        x: 0.5,
        y: 0,
        z: 0,
      },
      angular: {
        x: 0,
        y: 0,
        z: 0.5,
      },
    });
    this.topic!.publish(this.message);
    console.log('Sent Left command.');
  }else{
      console.log('Topic move no set');
    }
}

// Método para girar a la derecha
goRight(): void {
  if(this.topic){
    this.message = new ROSLIB.Message({
      linear: {
        x: 0.5,
        y: 0,
        z: 0,
      },
      angular: {
        x: 0,
        y: 0,
        z: -0.5,
      },
    });
    this.topic!.publish(this.message);
    console.log('Sent Right command.');
  }else{
      console.log('Topic move no set');
    }
}

 // Método para retroceder
goBack(): void {
  if(this.topic){
    this.message = new ROSLIB.Message({
      linear: {
        x: -1,
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
  }else{
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
    }else{
      console.log('Topic move no set');
    }
  }
}
