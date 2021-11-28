export const config = {
  port: 8081,
  log: {
    level: 'info',
    map: {
      time: '@timestamp',
      msg: 'message'
    }
  },
  mongo: {
    uri: 'mongodb://localhost:27017',
    db: 'masterdata'
  },
  retry: {
    1: 10000,
    2: 15000,
    3: 25000,
  },
  consumer: {
    client: {
      username: 'ah1t9hk0xx',
      password: 'QvMB75cxJ48KYRnGfwXcRNxzALyAeb7-',
      brokers: ['tricycle-01.srvs.cloudkafka.com:9094'],
    },
    groupId: 'my-group',
    topic: 'ah1t9hk0-default',
    retry: {
      count: 'retry',
      limit: 3,
    }
  },
  producer: {
    client: {
      username: 'ah1t9hk0',
      password: 'QvMB75cxJ48KYRnGfwXcRNxzALyAeb7-',
      brokers: ['tricycle-01.srvs.cloudkafka.com:9094', 'tricycle-02.srvs.cloudkafka.com:9094', 'tricycle-03.srvs.cloudkafka.com:9094'],
    },
    topic: 'ah1t9hk0-default'
  }
};
export const env = {
  sit: {
    mongo: {
      uri: 'mongodb://localhostx:27017',
      db: 'masterdata2'
    },
  }
};
