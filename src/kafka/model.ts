export interface ConsumerConfig {
  client: ClientConfig;
  groupId: string;
  topic: string;
  retry?: RetryConfig;
}
export interface ProducerConfig {
  client: ClientConfig;
  topic: string;
}
export interface ClientConfig {
  username: string;
  password: string;
  brokers: string[];
}
export interface RetryConfig {
  count: string;
  limit: number;
}
