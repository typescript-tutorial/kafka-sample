import { Producer } from 'kafkajs';
import { createKafka } from './kafka';
import { ClientConfig } from './model';

export interface AnyMap {
  [key: string]: any;
}
export interface HealthChecker {
  name(): string;
  build(data: AnyMap, error: any): AnyMap;
  check(): Promise<AnyMap>;
}
export function createKafkaChecker(conf: ClientConfig, service?: string, timeout?: number): KafkaChecker {
  const kafka = createKafka(conf.username, conf.password, conf.brokers);
  const producer = kafka.producer();
  return new KafkaChecker(producer, service, timeout);
}
export class KafkaChecker {
  timeout: number;
  service: string;
  constructor(public producer: Producer, service?: string, timeout?: number) {
    this.timeout = (timeout && timeout > 0 ? timeout : 4200);
    this.service = (service && service.length > 0 ? service : 'kafka');
    this.check = this.check.bind(this);
    this.name = this.name.bind(this);
    this.build = this.build.bind(this);
  }
  check(): Promise<AnyMap> {
    const obj = {} as AnyMap;
    const promise = new Promise<any>((resolve, reject) => {
      return this.producer.connect().then(() => resolve(obj)).catch(err => reject(`Kafka is down`));
    });
    if (this.timeout > 0) {
      return promiseTimeOut(this.timeout, promise);
    } else {
      return promise;
    }
  }
  name(): string {
    return this.service;
  }
  build(data: AnyMap, err: any): AnyMap {
    if (err) {
      if (!data) {
        data = {} as AnyMap;
      }
      data['error'] = err;
    }
    return data;
  }
}

function promiseTimeOut(timeoutInMilliseconds: number, promise: Promise<any>): Promise<any> {
  return Promise.race([
    promise,
    new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(`Timed out in: ${timeoutInMilliseconds} milliseconds!`);
      }, timeoutInMilliseconds);
    })
  ]);
}
