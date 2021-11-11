export interface ReaderConfig {
  client: ClientConfig,
  groupId: string,
  topic: string,
  retry: RetryConfig,
}

export interface WriterConfig {
  client: ClientConfig,
  topic: string,
}

export interface ClientConfig {
  username: string,
  password: string,
  brokers: string[],
} 

export interface RetryConfig{
  retryCountName: string,
  limitRetry: number,
}

export interface RetryConfig{
  retryCountName: string,
  limitRetry: number,
}
