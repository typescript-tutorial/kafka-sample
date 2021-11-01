export interface ReaderConfig {
  brokers: string[],
  client: ClientConfig,
  groupId: string,
  topic: string,
  retry: RetryConfig,
}

export interface WriterConfig {
  brokers: string[],
  client: ClientConfig,
  topic: string,
}

export interface ClientConfig {
  username: string,
  password: string
} 

export interface RetryConfig{
  retryCountName: string,
  limitRetry: number,
}

export interface RetryConfig{
  retryCountName: string,
  limitRetry: number,
}
