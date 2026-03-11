import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

const MONGOOSE_STATE_LABELS: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};
const CONNECTED_STATE = 1;

@Injectable()
export class AppService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getHealth() {
    const state =
      MONGOOSE_STATE_LABELS[this.connection.readyState] ?? 'unknown';

    if (
      Number(this.connection.readyState) !== CONNECTED_STATE ||
      !this.connection.db
    ) {
      throw new ServiceUnavailableException({
        status: 'error',
        database: state,
      });
    }

    await this.connection.db.admin().ping();

    return {
      status: 'ok',
      database: state,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
