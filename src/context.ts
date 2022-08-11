import { HealthController } from 'health-service';
import { RecordMetadata } from 'kafkajs';
import { createLogger, LogConfig, LogController, map } from 'logger-core';
import { createRetry, ErrorHandler, Handle, Handler, NumberMap } from 'mq-one';
import { Attributes, Validator } from 'xvalidators';
import { ConsumerConfig, createConsumer, createKafkaChecker, createProducer, ProducerConfig } from './kafka';
import { DB } from 'pg-extension';
import { Repository } from 'query-core';


export interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
}
export const user: Attributes = {
  id: {
    length: 40 
  },
  username: {
    required: true,
    length: 255
  },
  email: {
    format: 'email',
    required: true,
    length: 120
  },
  phone: {
    format: 'phone',
    required: true,
    length: 14
  },
  dateOfBirth: {
    type: 'datetime'
  }
};
export interface Config extends LogConfig {
  port?: number;
  consumer: ConsumerConfig;
  producer: ProducerConfig;
  retries?: NumberMap;
}
export interface ApplicationContext {
  health: HealthController;
  log: LogController;
  produce: (data: User) => Promise<RecordMetadata[]>;
  consume: (handle: Handle<User>) => Promise<void>;
  handle: Handle<User>;
}
export function createContext(db: DB, conf: Config): ApplicationContext {
  const retries = createRetry(conf.retries);
  const logger = createLogger(conf.log);
  const log = new LogController(logger, map);
  const kafkaChecker = createKafkaChecker(conf.consumer.client);
  const health = new HealthController([kafkaChecker]);

  const validator = new Validator<User>(user, true);
  const repository = new Repository<User, string>(db, 'kafka', user);

  const errorHandler = new ErrorHandler(logger.error);
  const handler = new Handler<User, RecordMetadata[]>(repository.insert, validator.validate, retries, errorHandler.error, logger.error, logger.info, undefined, 3, 'retry');

  const consumer = createConsumer<User>(conf.consumer, logger.error, logger.info);
  const producer = createProducer<User>(conf.producer, logger.info);
  console.log(producer.produce);
  return { health, log, produce: producer.produce, consume: consumer.consume, handle: handler.handle };
}
export function writeUser(msg: User): Promise<number> {
  console.log('Error: ' + JSON.stringify(msg));
  return Promise.resolve(1);
}
