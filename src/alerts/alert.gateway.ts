import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway(3001)  // Puerto donde escuchará el WebSocket
export default class AlertsGateway {
  @WebSocketServer()
  server: Server;

  // Método para enviar un mensaje de alerta
  sendAlert(message: string) {
    this.server.emit('alert', message); // Enviará un evento "alert" a todos los clientes conectados
  }
}