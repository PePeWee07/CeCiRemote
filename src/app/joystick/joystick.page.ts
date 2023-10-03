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
  public alertButtons = ['OK'];

  viewSettings: boolean = false;
  viewJoystick2:boolean = false;

  //variables para la conexion Ros
  connected = false;
  ros: ROSLIB.Ros | null = null;
  ipRobot: string = "172.16.71.84";
  port: string = "9090";
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
  maxAngular: number = 0.10;
  optionsJoystick: nipplejs.JoystickManagerOptions = {};

  constructor(private modalCtrl: ModalController) {
  }

  ngOnInit() {
  }
  ngOnDestroy(): void {
    this.batteryTopic!.unsubscribe();
  }

  ngAfterViewInit(): void {
      //configuracion del joystick
      this.optionsJoystick = {
        zone: document.getElementById('joystick')!,
        mode: 'static',
        multitouch: true,
        color: 'blue',
        size: 130,
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

  isToastOpen = false;
  setOpen(isOpen: boolean) {
    this.isToastOpen = isOpen;
  }

  configJoystick() {
    if (this.optionsJoystick.size! >= 201 || this.optionsJoystick.size! <= 99) {
      this.setOpen(true);
      this.optionsJoystick.size = 100;
    } else {
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
      this.batteryTopic!.unsubscribe();
      console.log('Disconnected from ROSBridge.');
    }
  }

  // Método para establecer el topic
  setTopic(): void {
    if (this.ros) {

      // Suscribirse al topic de velocidad
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
