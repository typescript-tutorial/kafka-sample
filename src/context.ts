import { HealthController } from 'express-ext';
import { RecordMetadata } from 'kafkajs';
import { Db } from 'mongodb';
import { MongoChecker, MongoUpserter } from 'mongodb-extension';
import { ErrorHandler, Handler, RetryService, RetryWriter, StringMap } from 'mq-one';
import { Attributes, Validator } from 'xvalidators';
import { ClientConfig, ConsumerConfig, createKafkaChecker, createSender, createSubscriber, ProducerConfig } from './kafka';

const client: ClientConfig = {
  username: 'ah1t9hk0',
  password: 'QvMB75cxJ48KYRnGfwXcRNxzALyAeb7-',
  brokers: ['tricycle-01.srvs.cloudkafka.com:9094', 'tricycle-02.srvs.cloudkafka.com:9094', 'tricycle-03.srvs.cloudkafka.com:9094'],
};
const producerConfig: ProducerConfig = {
  client,
  topic: 'ah1t9hk0-default',
};

const consumerConfig: ConsumerConfig = {
  client: {
    username: 'ah1t9hk0',
    password: 'QvMB75cxJ48KYRnGfwXcRNxzALyAeb7-',
    brokers: ['tricycle-01.srvs.cloudkafka.com:9094'],
  },
  groupId: 'my-group',
  topic: 'ah1t9hk0-default',
  retry: {
    count: 'retry',
    limit: 3,
  }
};

const retries = [15000, 10000, 20000];

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

export interface ApplicationContext {
  handle: (data: User, header?: StringMap) => Promise<number>;
  read: (handle: (data: User, attributes?: StringMap) => Promise<number>) => Promise<void>;
  health: HealthController;
}

export function createContext(db: Db): ApplicationContext {
  const mongoChecker = new MongoChecker(db);
  const kafkaChecker = createKafkaChecker(client);
  const health = new HealthController([mongoChecker, kafkaChecker]);
  const writer = new MongoUpserter(db.collection('users'), 'id');
  const retryWriter = new RetryWriter(writer.write, retries, writeUser, log);
  const sender = createSender<User>(producerConfig, log);
  const retryService = new RetryService<User, RecordMetadata[]>(sender.send, log, log);
  const errorHandler = new ErrorHandler(log);
  const validator = new Validator<User>(user, true);
  const handler = new Handler<User, RecordMetadata[]>(retryWriter.write, validator.validate, retries, errorHandler.error, log, log, retryService.retry, 3, 'retry');
  const subscriber = createSubscriber<User>(consumerConfig, log, log);
  const ctx: ApplicationContext = { read: subscriber.subscribe, handle: handler.handle, health };
  return ctx;
}
export function log(msg: any): void {
  console.log(JSON.stringify(msg));
}
export function writeUser(msg: User): Promise<number> {
  console.log('Error: ' + JSON.stringify(msg));
  return Promise.resolve(1);
}
