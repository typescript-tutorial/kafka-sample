import { Consumer as KafkaConsumer, IHeaders, KafkaMessage } from 'kafkajs';
import { StringMap, toString } from 'mq-one';
import { connect } from './connect';
import { createKafka } from './kafka';
import { ConsumerConfig } from './model';

export function createKafkaConsumer(conf: ConsumerConfig, logInfo?: (msg: string) => void): KafkaConsumer {
  const kafka = createKafka(conf.client.username, conf.client.password, conf.client.brokers);
  const consumer = kafka.consumer({
    groupId: conf.groupId,
  });
  connect(consumer, 'Consumer', logInfo);
  return consumer;
}
export function createConsumer<T>(conf: ConsumerConfig, logError?: (msg: string) => void, logInfo?: (msg: string) => void, json?: boolean): Consumer<T> {
  const c = createKafkaConsumer(conf, logInfo);
  const s = new Consumer<T>(c, conf.topic, logError, json);
  return s;
}
export class Consumer<T> {
  constructor(
    public consumer: KafkaConsumer,
    public topic: string,
    public logError?: (msg: string) => void,
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
          let s: string|undefined;
          try {
            if (message.value) {
              s = message.value.toString();
              const data = (this.json ? JSON.parse(s) : s);
              const attr: StringMap|undefined = mapHeaders(message.headers);
              await handle(data, attr, message);
            } else {
              s = undefined;
              if (this.logError) {
                this.logError('Message is empty');
              }
            }
          } catch (err) {
            if (err && this.logError) {
              if (s) {
                this.logError('Fail to consume message: ' + s + ' ' + toString(err));
              } else {
                this.logError('Error: ' + toString(err));
              }
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
export function mapHeaders(headers?: IHeaders): StringMap|undefined {
  if (!headers) {
    return undefined;
  }
  const attr: StringMap = {};
  const keys = Object.keys(headers);
  for (const key of keys) {
    const tam = headers[key];
    if (tam) {
      if (Buffer.isBuffer(tam)) {
        attr[key] = tam.toString();
      } else if (typeof tam === 'string') {
        attr[key] = tam;
      } else {
        attr[key] = '' + tam;
      }
    }
  }
  return attr;
}
