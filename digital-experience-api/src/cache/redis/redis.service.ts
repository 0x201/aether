import { readFileSync } from "fs"

import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { Redis, RedisOptions } from "ioredis"

import { CacheConfig } from "@/src/config/config.interface.js"

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis
  private readonly logger = new Logger(RedisService.name)
  private readonly options: RedisOptions

  constructor(private configService: ConfigService) {
    const cacheConfig = this.configService.getOrThrow<CacheConfig>("cache")

    this.options = {
      host: cacheConfig.host,
      port: cacheConfig.port,
      password: cacheConfig.password,
      db: cacheConfig.db,
      retryStrategy: (times: number) => {
        if (times > 10) {
          this.logger.error(`Redis failed to connect after ${times} attempts, giving up.`)
          return
        }
        const delay = Math.min(times * 50, 2000)
        this.logger.warn(`Redis connection failed, retrying in ${delay}ms...`)
        return delay
      },
      lazyConnect: true,
      enableReadyCheck: true,
      connectTimeout: 10000,
    }

    if (cacheConfig.ssl) {
      this.options.tls = {
        ca: readFileSync(cacheConfig.tls.ca, "utf8"),
        rejectUnauthorized: cacheConfig.tls.rejectUnauth,
      }
    }
  }

  private getClient(): Redis {
    if (!this.client) {
      this.logger.log("🚀 Initializing Redis client...")

      this.client = new Redis(this.options)
      this.client.on("connect", () => {
        this.logger.log("✅ Redis connected successfully!")
      })

      this.client.on("ready", () => {
        this.logger.log("✅ Redis is ready!")
      })

      this.client.on("error", (err) => {
        this.logger.error("❌ Redis error:", err)
      })

      this.client.on("reconnecting", () => {
        this.logger.warn("🔄 Redis is reconnecting...")
      })

      this.client.on("end", () => {
        this.logger.warn("⚠️ Redis connection closed.")
      })
    }
    return this.client
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const client = this.getClient()
    if (ttl) {
      await client.setex(key, ttl, value)
    } else {
      await client.set(key, value)
    }
  }

  async get(key: string): Promise<string | null> {
    const client = this.getClient()
    return client.get(key)
  }

  async del(key: string): Promise<number> {
    const client = this.getClient()
    return client.del(key)
  }

  async exists(key: string): Promise<boolean> {
    const client = this.getClient()
    return (await client.exists(key)) === 1
  }

  async incr(key: string): Promise<number> {
    const client = this.getClient()
    return client.incr(key)
  }

  async publish(channel: string, message: string): Promise<number> {
    const client = this.getClient()
    return client.publish(channel, message)
  }

  async subscribe(channel: string, callback: (msg: string) => void): Promise<void> {
    const client = this.getClient()
    await client.subscribe(channel)
    client.on("message", (ch, msg) => {
      if (ch === channel) callback(msg)
    })
  }

  getConnectionStatus(): string {
    return this.client?.status || "disconnected"
  }

  async ping(): Promise<string> {
    const client = this.getClient()
    return client.ping()
  }

  onModuleDestroy() {
    this.client.quit().catch((err) => this.logger.error("Redis disconnection error:", err))
  }
}
