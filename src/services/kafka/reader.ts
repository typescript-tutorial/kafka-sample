import { Consumer, IHeaders, KafkaMessage } from "kafkajs";
import { StringMap, toString } from "mq-one";
import { connect } from "./connect";
import { createKafka } from "./kafkaClient";
import { ReaderConfig } from "./model";

export class Reader<T> {
    private consumer: Consumer;
    private groupId: string;
    private topic: string;
    json?: boolean;
    constructor(
        private readerConfig: ReaderConfig, 
        public logError?: (msg: any) => void,
        public logInfo?: (msg: any) => void, json?: boolean
    ) {
        this.json = json;
        const kafka = createKafka(this.readerConfig.client.username, this.readerConfig.client.password, this.readerConfig.client.brokers);
        this.groupId = this.readerConfig.groupId;
        this.topic = this.readerConfig.topic;
        this.consumer = kafka.consumer({
            groupId:this.groupId,
        });
        connect(this.consumer, "Consumer", this.logInfo);
        this.read = this.read.bind(this);
    }
    async read(handle: (data: T, attributes?: StringMap) => Promise<number>): Promise<void> {
        try{
            // fromBeginning config option calling, true for "earliest" , false for "latest"
            await this.consumer.subscribe({ topic: this.topic, fromBeginning: true });
            await this.consumer.run({
                eachMessage: async ({ message }) => {
                    try {
                        if (message.value) {
                            const data = (this.json ? JSON.parse(message.value.toString()) : message.value.toString());
                            const attr: StringMap = convertStringMap(message.headers);
                            await handle(data, attr)
                        }else{
                            if ( this.logError ) {
                                this.logError('Message is empty');
                            }
                        }
                    } catch (err) {
                        if (err && this.logError) {
                          this.logError('Fail to consume message: ' + toString(err));
                        }
                    }
                },
            })
        }catch(err){
            if (err && this.logError) {
                this.logError('Fail to consume message: ' + toString(err));
            }
        }
    }
}   


function convertStringMap(headers?: IHeaders):StringMap {
    const attr: StringMap = {};
    if (headers) {
        let keys = Object.keys(headers);
        for(let key of keys) {
            let tam = headers[key];
            if (tam) {
                if (Buffer.isBuffer(tam)) {
                    attr[key]  = tam.toString();
                } 
                if (typeof tam === "string") {
                    attr[key]  = tam;
                }   
            } else {
                attr[key]  = "";
            }
        }
    }
    return attr;
}