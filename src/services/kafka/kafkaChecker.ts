import { Producer } from 'kafkajs';
import { createKafka } from './kafkaClient';
import { ClientConfig } from './model';

export interface AnyMap {
  [key: string]: any;
}
export interface HealthChecker {
  name(): string;
  build(data: AnyMap, error: any): AnyMap;
  check(): Promise<AnyMap>;
}

export interface CheckResult {
  status: string;
  details: AnyMap;
}

export class KafkaChecker {
  produce: Producer;
  constructor(public config: ClientConfig, public service?: string, private timeout?: number) {
    const kafka = createKafka(this.config.username, this.config.password, this.config.brokers);
    this.produce = kafka.producer();
    this.check = this.check.bind(this);
    this.name = this.name.bind(this);
    this.build = this.build.bind(this);
  }
  check(): Promise<AnyMap> {
    const obj = {} as AnyMap;
    const promise = new Promise<any>(async (resolve, reject) => {
      try {
        await this.produce.connect();
        resolve(obj);
      } catch (err) {
        reject(`Database down!`);
      }
    });
    if (!this.timeout) {
      this.timeout = 4200;
    }
    if (this.timeout > 0) {
      return promiseTimeOut(this.timeout, promise);
    } else {
      return promise;
    }
  }
  name(): string {
    if (!this.service) {
      this.service = 'kafka';
    }
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
