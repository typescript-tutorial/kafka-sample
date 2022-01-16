
import { merge } from 'config-plus';
import dotenv from 'dotenv';
import http from 'http';
import { getBody } from 'logger-core';
import { connectToDb } from 'mongodb-extension';
import { config } from './config';
import { createContext } from './context';

dotenv.config();
const conf = merge(config, process.env);

connectToDb(`${conf.mongo.uri}`, `${conf.mongo.db}`).then(db => {
  const ctx = createContext(db, conf);
  ctx.consume(ctx.handle);
  http.createServer((req, res) => {
    if (req.url === '/health') {
      ctx.health.check(req, res);
    } else if (req.url === '/log') {
      ctx.log.config(req, res);
    } else if (req.url === '/send') {
      getBody(req).then(body => {
        ctx.produce(JSON.parse(body)).then(() => {
          res.writeHead(200, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({message: 'message was produced'}));
        }).catch(err => {
          res.writeHead(500, {'Content-Type': 'application/json'});
          res.end(JSON.stringify({error: err}));
        });
      });
    }
  }).listen(conf.port, () => {
    console.log('Start server at port ' + conf.port);
  });
});
