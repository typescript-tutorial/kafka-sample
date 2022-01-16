import { HealthController } from 'health-service';
import { RecordMetadata } from 'kafkajs';
import { createLogger, LogConfig, LogController, map } from 'logger-core';
import { Db } from 'mongodb';
import { MongoChecker, MongoUpserter } from 'mongodb-extension';
import { createRetry, ErrorHandler, Handle, Handler, NumberMap } from 'mq-one';
import { Attributes, Validator } from 'xvalidators';
import { ConsumerConfig, createConsumer, createKafkaChecker, createProducer, ProducerConfig } from './kafka';

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
export function createContext(db: Db, conf: Config): ApplicationContext {
  const retries = createRetry(conf.retries);
  const logger = createLogger(conf.log);
  const log = new LogController(logger, map);
  const mongoChecker = new MongoChecker(db);
  const kafkaChecker = createKafkaChecker(conf.consumer.client);
  const health = new HealthController([mongoChecker, kafkaChecker]);

  const validator = new Validator<User>(user, true);
  const writer = new MongoUpserter(db.collection('users'), 'id');
  const errorHandler = new ErrorHandler(logger.error);
  const handler = new Handler<User, RecordMetadata[]>(writer.write, validator.validate, retries, errorHandler.error, logger.error, logger.info, undefined, 3, 'retry');

  const consumer = createConsumer<User>(conf.consumer, logger.error, logger.info);
  const producer = createProducer<User>(conf.producer, logger.info);
  return { health, log, produce: producer.produce, consume: consumer.consume, handle: handler.handle };
}
export function writeUser(msg: User): Promise<number> {
  console.log('Error: ' + JSON.stringify(msg));
  return Promise.resolve(1);
}
