import { Consumer, IHeaders, KafkaMessage } from 'kafkajs';
import { StringMap, toString } from 'mq-one';
import { connect } from './connect';
import { createKafka } from './kafka';
import { ConsumerConfig } from './model';

export function createConsumer(conf: ConsumerConfig, logInfo?: (msg: any) => void): Consumer {
  const kafka = createKafka(conf.client.username, conf.client.password, conf.client.brokers);
  const consumer = kafka.consumer({
    groupId: conf.groupId,
  });
  connect(consumer, 'Consumer', logInfo);
  return consumer;
}
export function createSubscriber<T>(conf: ConsumerConfig, logError?: (msg: any) => void, logInfo?: (msg: any) => void, json?: boolean): Subscriber<T> {
  const c = createConsumer(conf, logInfo);
  const s = new Subscriber<T>(c, conf.topic, logError, json);
  return s;
}
export class Subscriber<T> {
  constructor(
    public consumer: Consumer,
    public topic: string,
    public logError?: (msg: any) => void,
    public json?: boolean
  ) {
    this.subscribe = this.subscribe.bind(this);
  }
  async subscribe(handle: (data: T, headers?: StringMap, raw?: KafkaMessage) => Promise<number>): Promise<void> {
    try {
      // fromBeginning config option calling, true for "earliest" , false for "latest"
      await this.consumer.subscribe({ topic: this.topic, fromBeginning: true });
      await this.consumer.run({
        eachMessage: async ({ message }) => {
          try {
            if (message.value) {
              const data = (this.json ? JSON.parse(message.value.toString()) : message.value.toString());
              const attr: StringMap = mapHeaders(message.headers);
              await handle(data, attr, message);
            } else {
              if (this.logError) {
                this.logError('Message is empty');
              }
            }
          } catch (err) {
            if (err && this.logError) {
              this.logError('Fail to consume message: ' + toString(err));
            }
          }
        },
      });
    } catch (err) {
      if (err && this.logError) {
        this.logError('Fail to consume message: ' + toString(err));
      }
    }
  }
}

export function mapHeaders(headers?: IHeaders): StringMap {
  const attr: StringMap = {};
  if (headers) {
    const keys = Object.keys(headers);
    for (const key of keys) {
      const tam = headers[key];
      if (tam) {
        if (Buffer.isBuffer(tam)) {
          attr[key] = tam.toString();
        }
        if (typeof tam === 'string') {
          attr[key] = tam;
        }
      } else {
        attr[key] = '';
      }
    }
  }
  return attr;
}
