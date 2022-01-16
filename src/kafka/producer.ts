import { Message, Producer as KafkaProducer, RecordMetadata } from 'kafkajs';
import { StringMap } from 'mq-one';
import { connect } from './connect';
import { createKafka } from './kafka';
import { ClientConfig, ProducerConfig } from './model';

export function createKafkaProducer(conf: ClientConfig, log?: (msg: string) => void): KafkaProducer {
  const kafka = createKafka(conf.username, conf.password, conf.brokers);
  const producer = kafka.producer();
  connect(producer, 'Producer', log);
  return producer;
}
export const createKafkaPublisher = createKafkaProducer;
export const createKafkaWriter = createKafkaProducer;
export const createKafkaSender = createKafkaProducer;
export function createProducer<T>(conf: ProducerConfig, log?: (msg: string) => void): Producer<T> {
  const p = createKafkaProducer(conf.client, log);
  const s = new Producer(p, conf.topic);
  return s;
}
export const createPublisher = createProducer;
export const createWriter = createProducer;
export const createSender = createProducer;
export class Producer<T> {
  constructor(public producer: KafkaProducer, public topic: string) {
    this.produce = this.produce.bind(this);
    this.send = this.send.bind(this);
    this.put = this.put.bind(this);
    this.write = this.write.bind(this);
    this.publish = this.publish.bind(this);
  }
  send(data: T, headers?: StringMap): Promise<RecordMetadata[]> {
    return this.produce(data, headers);
  }
  put(data: T, headers?: StringMap): Promise<RecordMetadata[]> {
    return this.produce(data, headers);
  }
  write(data: T, headers?: StringMap): Promise<RecordMetadata[]> {
    return this.produce(data, headers);
  }
  publish(data: T, headers?: StringMap): Promise<RecordMetadata[]> {
    return this.produce(data, headers);
  }
  produce(data: T, headers?: StringMap): Promise<RecordMetadata[]> {
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
export const Publisher = Producer;
export const Sender = Producer;
export const Writer = Producer;
export function createTopicProducer<T>(conf: ClientConfig, log?: (msg: string) => void): TopicProducer<T> {
  const p = createKafkaProducer(conf, log);
  const s = new TopicProducer(p);
  return s;
}
export const createTopicPublisher = createTopicProducer;
export const createTopicWriter = createTopicProducer;
export const createTopicSender = createTopicProducer;
// tslint:disable-next-line:max-classes-per-file
export class TopicProducer<T> {
  constructor(public producer: KafkaProducer) {
    this.produce = this.produce.bind(this);
    this.send = this.send.bind(this);
    this.put = this.put.bind(this);
    this.write = this.write.bind(this);
    this.publish = this.publish.bind(this);
  }
  send(topic: string, data: T, headers?: StringMap): Promise<RecordMetadata[]> {
    return this.produce(topic, data, headers);
  }
  put(topic: string, data: T, headers?: StringMap): Promise<RecordMetadata[]> {
    return this.produce(topic, data, headers);
  }
  write(topic: string, data: T, headers?: StringMap): Promise<RecordMetadata[]> {
    return this.produce(topic, data, headers);
  }
  publish(topic: string, data: T, headers?: StringMap): Promise<RecordMetadata[]> {
    return this.produce(topic, data, headers);
  }
  produce(topic: string, data: T, headers?: StringMap): Promise<RecordMetadata[]> {
    const msg: Message = {
      value: (typeof data === 'string' ? data : JSON.stringify(data)),
      headers
    };
    return this.producer.send({
      topic,
      messages: [msg],
      acks: 1,
    });
  }
}
export const TopicPublisher = TopicProducer;
export const TopicSender = TopicProducer;
export const TopicWriter = TopicProducer;
