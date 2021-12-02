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
import { Socket } from 'socket.io';
import { Server } from 'typeorm';

@WebSocketGateway(2505, {
  transports: ['websocket'],
  namespace: 'rooms',
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor() {}

  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('SocketGateway');

  @SubscribeMessage('/')
  handleEvent(@MessageBody() data: string): string {
    console.log('websocket healthy check');
    return data;
  }

  @SubscribeMessage('drawing')
  handleMessage(
    @MessageBody() data: { width: number; x: number; y: number; color: string }, // 클라이언트로부터 들어온 데이터
    @ConnectedSocket() client: Socket,
  ) {
    this.server.emit('drawing', data);
  }

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
    this.logger.log(`Client Connected : ${client.id}`);
  }
}
