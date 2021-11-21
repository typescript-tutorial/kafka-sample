import { Message, Producer as KafkaProducer, RecordMetadata } from 'kafkajs';
import { StringMap } from 'mq-one';
import { connect } from './connect';
import { createKafka } from './kafka';
import { ProducerConfig } from './model';

export function createKafkaProducer(conf: ProducerConfig, log?: (msg: any) => void): KafkaProducer {
  const kafka = createKafka(conf.client.username, conf.client.password, conf.client.brokers);
  const producer = kafka.producer();
  connect(producer, 'Producer', log);
  return producer;
}
export function createProducer<T>(conf: ProducerConfig, log?: (msg: any) => void): Producer<T> {
  const p = createKafkaProducer(conf, log);
  const s = new Producer(p, conf.topic);
  return s;
}
export class Producer<T> {
  constructor(public producer: KafkaProducer, public topic: string) {
    this.send = this.send.bind(this);
  }
  send(data: T, headers?: StringMap): Promise<RecordMetadata[]> {
    const msg: Message = {
      value: (typeof data === 'string' ? data : JSON.stringify(data)),
      headers
    };
    return this.producer.send({
      topic: this.topic,
      messages: [msg],
      acks: 1,
    });
  }
}
