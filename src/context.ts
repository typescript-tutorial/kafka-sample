import { HealthController } from 'express-ext';
import { RecordMetadata } from 'kafkajs';
import { JSONLogger, LogConfig } from 'logger-core';
import { Db } from 'mongodb';
import { MongoChecker, MongoInserter } from 'mongodb-extension';
import { createRetry, ErrorHandler, Handler, NumberMap, StringMap } from 'mq-one';
import { Attributes, Validator } from 'xvalidators';
import { ConsumerConfig, createConsumer, createKafkaChecker } from './kafka';

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
export interface Config {
  port?: number;
  log: LogConfig;
  consumer: ConsumerConfig;
  retry?: NumberMap;
}
export interface ApplicationContext {
  handle: (data: User, header?: StringMap) => Promise<number>;
  read: (handle: (data: User, attributes?: StringMap) => Promise<number>) => Promise<void>;
  health: HealthController;
}
export function createContext(db: Db, conf: Config): ApplicationContext {
  const retries = createRetry(conf.retry);
  const logger = new JSONLogger(conf.log.level, conf.log.map);
  const mongoChecker = new MongoChecker(db);
  const kafkaChecker = createKafkaChecker(conf.consumer.client);
  const health = new HealthController([mongoChecker, kafkaChecker]);
  const writer = new MongoInserter(db.collection('users'), 'id');
/*
  const retryWriter = new RetryWriter(writer.write, retries, writeUser, logger.error);
  const sender = createProducer<User>(producerConfig, logger.info);
  const retryService = new RetryService<User, RecordMetadata[]>(sender.send, logger.error, logger.info);
  */
  const errorHandler = new ErrorHandler(logger.error);
  const validator = new Validator<User>(user, true);
  const handler = new Handler<User, RecordMetadata[]>(writer.write, validator.validate, retries, errorHandler.error, logger.error, logger.info, undefined, 3, 'retry');
  const subscriber = createConsumer<User>(conf.consumer, logger.error, logger.info);
  const ctx: ApplicationContext = { read: subscriber.subscribe, handle: handler.handle, health };
  return ctx;
}
export function writeUser(msg: User): Promise<number> {
  console.log('Error: ' + JSON.stringify(msg));
  return Promise.resolve(1);
}
