import { NotFoundException } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { IAlertMessage } from 'src/common/interfaces/alert-message.interface';

@WebSocketGateway(3001, { cors: { origin: '*' } }) // Port where you will hear the WebSocket
export default class AlertsGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // The list is created so that alerts can be sent to specific client (users)
  // Relating your client (machine) ID to your ID and your user ID
  private clients: Map<string, string> = new Map(); // [[key, value]] -> [socket.id, user_id]

  @SubscribeMessage('register')
  register(client: Socket, userId: string) {
    console.log(`Client registered: ${client.id} - for the user: ${userId}`);
    this.clients.set(client.id, userId); // add new connection to list
  }
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.clients.delete(client.id); // delete connenction of list when client is disconnected
  }

  sendAlert(userId: string, alertMessage: IAlertMessage) {
    // Get the specific client to whom the message will be sent
    // base on the user id associated
    const clientId = [...this.clients].find(
      ([, user_id]) => user_id === userId,
    )?.[0];

    if (!clientId)
      throw new NotFoundException('Client to send the message not found');

    this.server.to(clientId).emit('alert', alertMessage); // Send an "alert" event and info to the specified client

    console.log(
      `Alert sent to client ${clientId} - user id ${userId} : ${alertMessage.alert_type} - ${alertMessage.budget_name} - ${alertMessage.message}`,
    );

    return;
  }
}
