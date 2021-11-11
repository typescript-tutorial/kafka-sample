import { Message, Producer, RecordMetadata } from "kafkajs";
import { StringMap } from "mq-one";
import { connect } from "./connect";
import { createKafka } from "./kafkaClient";
import { WriterConfig } from "./model";

export class Writer<T> {
    private producer: Producer;
    private topic: string;
    constructor(private writeConfig: WriterConfig, private log?: (msg: any)=> void) {
        if (!this.log){
            this.log = console.log;
        };
        this.topic = this.writeConfig.topic;
        const kafka = createKafka(this.writeConfig.client.username, this.writeConfig.client.password, this.writeConfig.client.brokers);
        this.producer = kafka.producer();
        connect(this.producer, "Producer", this.log);
        this.write = this.write.bind(this);
    }
    async write(data: T, attributes?: StringMap): Promise<RecordMetadata[]> {
        const msg:Message = {
            value: JSON.parse(data as any), 
            headers: attributes
        }
        try{
            return await this.producer.send({
                topic: this.topic,
                messages: [msg],
                acks: 1,
            })
        } catch(err) {
            throw err;
        }
    }
}