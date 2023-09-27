import { Component, AfterViewInit } from '@angular/core';
import * as ROSLIB from 'roslib';
import * as nipplejs from 'nipplejs';

@Component({
  selector: 'app-joystick',
  templateUrl: './joystick.page.html',
  styleUrls: ['./joystick.page.scss'],
})
export class JoystickPage implements AfterViewInit {
  connected = false;
  ros: ROSLIB.Ros | null = null;
  wsAddress = 'ws://localhost:9090';
  topic: ROSLIB.Topic | null = null;
  message: ROSLIB.Message | null = null;

  constructor() {}

  ngAfterViewInit(): void {
    // Configura las opciones del joystick
    const options: nipplejs.JoystickManagerOptions = {
      zone: document.getElementById('joystick')!, // Elemento HTML de destino
      mode: 'static', // Puedes cambiar esto a 'dynamic' si deseas que el joystick se mueva por toda la pantalla
      //position: { left: '50%', top: '100%' }, // Posición inicial del joystick
      color: 'red', // Color del joystick,
      size: 170, // Tamaño del joystick
    };

    // Crea el joystick
    const manager = nipplejs.create(options);

    // Variables iniciales para velocidades lineal y angular
    var linearSpeed = 0.0;
    var angularSpeed = 0.0;

    //movimientos Lineales (ajustar al gusto)
    var maxLinear = 1;
    var maxAngular = 2;

    // Manejador para el evento 'move' del joystick
    manager.on('move',  (_event, nipple) => {
      // Calcular velocidades en función de la posición del joystick
      linearSpeed = Math.sin(nipple.angle.radian) * maxLinear;
      angularSpeed = -Math.cos(nipple.angle.radian) * maxAngular;

      this.moveRobot(linearSpeed, angularSpeed);
    });

    // Manejador para el evento 'end' del joystick velocidades en cero cuando se suelta el joystick
    manager.on('end',  () => {
      linearSpeed = 0.0;
      angularSpeed = 0.0;
      this.moveRobot(linearSpeed, angularSpeed);
    });

  }

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
    console.log('Did you connect to ROSBridge?');

    this.ros = new ROSLIB.Ros({
      url: this.wsAddress,
    });

    this.ros.on('connection', () => {
      console.log('Connected!');
      this.connected = true;
      this.setTopic();
    });

    this.ros.on('error', (error) => {
      console.log('Error connecting to websocket server: ', error);
    });

    this.ros.on('close', () => {
      console.log('Connection to websocket server closed.');
      this.connected = false;
    });
  }

  //desconectar de ROSBridge
  disconnect(): void {
    if (this.ros) {
      this.ros.close();
      console.log('Disconnected from ROSBridge.');
    }
  }

  // Método para establecer el topic
  setTopic(): void {
    if (this.ros) {
      this.topic = new ROSLIB.Topic({
        ros: this.ros,
        name: '/turtle1/cmd_vel', // Nombre del topic
        messageType: 'geometry_msgs/Twist',
      });
      console.log('Topic set to /turtle1/cmd_vel');
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
    }
  }

  // Método para girar a la izquierda
  goLeft(): void {
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
}

// Método para girar a la derecha
goRight(): void {
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
}

 // Método para retroceder
goBack(): void {
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
    }
  }
}
