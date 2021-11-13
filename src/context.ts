import { HealthController } from 'express-ext';
import { StringMap } from 'mq-one';
import { User } from './models/User';

export interface ApplicationContext {
  handle: (data: User, header?: StringMap) => Promise<number>;
  read: (handle: (data: User, attributes?: StringMap | undefined) => Promise<number>) => Promise<void>;
  health: HealthController;
}
