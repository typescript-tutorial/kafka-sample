import { Message, Producer, RecordMetadata } from 'kafkajs';
import { StringMap } from 'mq-one';
import { connect } from './connect';
import { createKafka } from './kafka';
import { WriterConfig } from './model';

export class Sender<T> {
  private producer: Producer;
  private topic: string;
  constructor(private writeConfig: WriterConfig, private log?: (msg: any) => void) {
    if (!this.log) {
      this.log = console.log;
    }
    this.topic = this.writeConfig.topic;
    const kafka = createKafka(this.writeConfig.client.username, this.writeConfig.client.password, this.writeConfig.client.brokers);
    this.producer = kafka.producer();
    connect(this.producer, 'Producer', this.log);
    this.send = this.send.bind(this);
  }
  async send(data: T, attributes?: StringMap): Promise<RecordMetadata[]> {
    const msg: Message = {
      value: JSON.parse(data as any),
      headers: attributes
    };
    try {
      return await this.producer.send({
        topic: this.topic,
        messages: [msg],
        acks: 1,
      });
    } catch (err) {
      throw err;
    }
  }
}
