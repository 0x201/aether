export interface AppConfig {
  apiBaseUrl: string
  apiVersion: string
}

class ConfigLoader {
  private config: AppConfig

  constructor() {
    // Use Vite's environment variables with fallbacks
    this.config = {
      apiBaseUrl: import.meta.env.VITE_API_URL,
      apiVersion: import.meta.env.VITE_API_VERSION,
    }
  }

  public getConfig(): AppConfig {
    return this.config
  }

  public get<T = unknown>(key: string, deaultValue?: T): T {
    const keys = key.split('.')
    let value: unknown = this.config

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k]
      } else {
        return deaultValue as T
      }
    }

    return value as T
  }
}

const configLoader = new ConfigLoader()
export const config = configLoader.getConfig()
export const getConfig = configLoader.get.bind(configLoader)

export default config
