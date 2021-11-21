import { Message, Producer, RecordMetadata } from 'kafkajs';
import { StringMap } from 'mq-one';
import { connect } from './connect';
import { createKafka } from './kafka';
import { ProducerConfig } from './model';

export function createProducer(conf: ProducerConfig, log?: (msg: any) => void): Producer {
  const kafka = createKafka(conf.client.username, conf.client.password, conf.client.brokers);
  const producer = kafka.producer();
  connect(producer, 'Producer', log);
  return producer;
}
export function createSender<T>(conf: ProducerConfig, log?: (msg: any) => void): Sender<T> {
  const p = createProducer(conf, log);
  const s = new Sender(p, conf.topic);
  return s;
}
export class Sender<T> {
  constructor(public producer: Producer, public topic: string) {
    this.send = this.send.bind(this);
  }
  send(data: T, headers?: StringMap): Promise<RecordMetadata[]> {
    const msg: Message = {
      value: JSON.parse(data as any),
      headers
    };
    return this.producer.send({
      topic: this.topic,
      messages: [msg],
      acks: 1,
    });
  }
}
