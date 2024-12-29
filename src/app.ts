import { merge } from "config-plus"
import dotenv from "dotenv"
import http from "http"
import { getBody } from "logger-core"
import { Pool } from "pg"
import { PoolManager } from "pg-extension"

import { config } from "./config"
import { createContext } from "./context"

dotenv.config()
const conf = merge(config, process.env)

const pool = new Pool(conf.postgres)
const db = new PoolManager(pool)

const ctx = createContext(db, conf)
ctx.consume(ctx.handle)

http
  .createServer((req, res) => {
    if (req.url === "/health") {
      ctx.health.check(req, res)
    } else if (req.url === "/log") {
      ctx.log.config(req, res)
    } else if (req.url === "/send") {
      getBody(req).then((body: any) => {
        console.log(getBody(req), ctx.produce(JSON.parse(body)))
        ctx
          .produce(JSON.parse(body))
          .then(() => {
            res.writeHead(200, { "Content-Type": "application/json" })
            res.end(JSON.stringify({ message: "message was produced" }))
          })
          .catch((err) => {
            res.writeHead(500, { "Content-Type": "application/json" })
            res.end(JSON.stringify({ error: err }))
          })
      })
    }
  })
  .listen(conf.port, () => {
    console.log("Start server at port " + conf.port)
  })
