import { Consumer, Producer } from "kafkajs";

export async function connect (kafka: Consumer|Producer, name: string,log?: (msg: any)=> void) {
    if (!log){
        log = console.log;
    }
    try {
        await kafka.connect();
        log(`${name} connected`);
    } catch (err) {
        log(`${name} connected feild: ${err}`);
    }
}
