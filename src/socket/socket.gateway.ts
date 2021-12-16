import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';

@WebSocketGateway(3101, {
  transports: ['websocket'],
  namespace: 'rooms',
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor() {}

  @WebSocketServer() server: Server;
  wsClients = [];
  private logger: Logger = new Logger('SocketGateway');

  @SubscribeMessage('test')
  handleTest(
    @MessageBody() data, // 클라이언트로부터 들어온 데이터
    @ConnectedSocket() client: Socket,
  ) {
    const id = client.id;
    console.log(data);
    console.log(`${client.id}: [${new Date()}]`);
    console.log(this.wsClients);
    for (const i of this.wsClients) {
      if (i !== id) {
        this.server.to(i).emit('test', data);
        console.log(`mine: ${id}`);
        console.log(`yours: ${i}`);
      }
    }
    return data;
  }

  // @SubscribeMessage('drawing')
  // handleMessage(
  //   @MessageBody() data: { width: number; x: number; y: number; color: string }, // 클라이언트로부터 들어온 데이터
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   this.server.emit('drawing', data);
  // }

  // @Cron('* * * * * *')
  // broadcastTest(@ConnectedSocket() socket: Socket): void {
  //   this.server.emit('test-event', { msg: 'broadcast', time: new Date() });
  // }

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client Disconnected : ${client.id}`);
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.wsClients.push(client.id);
    this.logger.log(`Client Connected : ${client.id}`);
  }
}
