import {Db} from 'mongodb';
import {ApplicationContext} from './context';
import { Attributes, Validator } from 'validator-x';
import { Reader } from './services/kafka/reader';
import { ErrorHandler, Handler, RetryService, RetryWriter } from 'mq-one';
import { Writer } from './services/kafka/writer';
import { ReaderConfig, WriterConfig } from './services/kafka/model';
import { User } from 'models/User';
import { MongoInserter } from 'mongodb-extension';
import { RecordMetadata } from 'kafkajs';
  
const readerConfig: ReaderConfig= {
  brokers:['tricycle-01.srvs.cloudkafka.com:9094'],
  client: {
    username: 'ah1t9hk0',
    password: 'QvMB75cxJ48KYRnGfwXcRNxzALyAeb7-'
  },
  groupId: 'my-group',
  topic: 'ah1t9hk0-default',
  retry: {
    retryCountName: 'retry',
    limitRetry: 3,
  }
}

const writerConfig: WriterConfig = {
  brokers:['tricycle-01.srvs.cloudkafka.com:9094', 'tricycle-02.srvs.cloudkafka.com:9094', 'tricycle-03.srvs.cloudkafka.com:9094'],
  client: {
    username: 'ah1t9hk0',
    password: 'QvMB75cxJ48KYRnGfwXcRNxzALyAeb7-'
  },
  topic: 'ah1t9hk0-default',
};

const user: Attributes = {
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

const retries = [15000, 10000, 20000];

export function createContext(db: Db): ApplicationContext {
    const writer = new MongoInserter(db.collection('users'), 'id');
    const retryWriter = new RetryWriter(writer.write, retries, writeUser, log);
    const writerKafka = new Writer<User>(writerConfig, log);
    const retryService = new RetryService<User, RecordMetadata[]>(writerKafka.write, log, log);
    const errorHandler = new ErrorHandler(log);
    const validator = new Validator<User>(user, true);
    const handler = new Handler<User, RecordMetadata[]>(retryWriter.write, validator.validate , retries, errorHandler.error, log, log, retryService.retry, 3, 'retry');
    const reader = new Reader<User>(readerConfig, log);
    const ctx: ApplicationContext = {read: reader.read, handle: handler.handle};
    return ctx;
}

export function log(msg: any): void {
  console.log(JSON.stringify(msg));
}

export function writeUser(msg: User): Promise<number> {
  console.log('Error: ' + JSON.stringify(msg));
  return Promise.resolve(1);
}