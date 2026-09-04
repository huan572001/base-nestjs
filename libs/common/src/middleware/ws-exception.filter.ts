import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
export class WebsocketExceptionsFilter extends BaseWsExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    const error = this.transformException(exception);

    // Send error to client without disconnecting
    client.emit('exception', {
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }

  private transformException(exception: Error) {
    if (exception instanceof WsException) {
      return exception;
    }
    return new WsException(exception.message || 'Internal server error');
  }
}
