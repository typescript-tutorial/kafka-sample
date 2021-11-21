import { Consumer, Producer } from 'kafkajs';

export function connect(kafka: Consumer | Producer, name: string, log?: (msg: any) => void): Promise<void> {
  const lg = (log ? log : console.log);
  if (!log) {
    log = console.log;
  }
  return kafka.connect().then(() => lg(`${name} connected`)).catch(err => lg(`${name} connected feild: ${err}`));
}
