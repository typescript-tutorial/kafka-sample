import { Kafka, KafkaConfig, SASLOptions } from "kafkajs";

export function createKafka (username:string, password:string, brokers: string[]):Kafka {
    const sasl:SASLOptions = { username, password, mechanism: 'scram-sha-512' } 
    const ssl = !!sasl;
    const kafkaConfig: KafkaConfig = {
        brokers,
        ssl,
        sasl,
        connectionTimeout: 30000,
    };
    const kafka = new Kafka(kafkaConfig);
    return kafka
}