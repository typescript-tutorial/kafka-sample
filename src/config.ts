export const config = {
  port: 8084,
  log: {
    level: 'info',
    map: {
      time: '@timestamp',
      msg: 'message'
    }
  },
  postgres: {
    connectionString: "postgres://postgres:abcd1234@localhost/masterdata",
    /*
    user: 'dqcpsquyjmmxkb',
    host: 'ec2-54-228-125-183.eu-west-1.compute.amazonaws.com',
    password: '1093639f514498fbf09e803d98714b853849704783dc052aa1ef2039c60fe6e0',
    database: 'd8maa489i4calm',
    port: 5432,
    ssl: {
      rejectUnauthorized: false,
    }*/
  },
  retries: {
    1: 10000,
    2: 15000,
    3: 25000,
  },
  consumer: {
    client: {
      username: 'ah1t9hk0',
      password: 'QvMB75cxJ48KYRnGfwXcRNxzALyAeb7-',
      brokers: ['tricycle-01.srvs.cloudkafka.com:9094'],
    },
    groupId: 'my-group',
    topic: 'ah1t9hk0-default',
    retry: {
      name: 'retry',
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
