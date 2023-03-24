import * as fs from 'fs'
import * as util from 'util'
import { getLogger } from '../logging'

const logger = getLogger({ name: 'content-cache' })

const readFile = util.promisify(fs.readFile)

export class ContentCache {
  private cache: Map<string, string>

  constructor() {
    this.cache = new Map()
  }

  public async getFile(path: string) {
    if (this.cache.has(path)) {
      logger.trace({ path }, `Cache hit`)
      return this.cache.get(path)
    }
    logger.debug({ path }, `Cache miss`)
    const content = (await readFile(path)).toString()
    this.cache.set(path, content)
    return content
  }

  public getFileSync(path: string) {
    if (this.cache.has(path)) {
      logger.trace({ path }, `Cache hit`)
      const val = this.cache.get(path)
      if (val) {
        return val
      }
    }
    logger.debug({ path }, `Cache miss`)
    const content = fs.readFileSync(path).toString()
    this.cache.set(path, content)
    return content
  }

  public getKey(key: string) {
    if (this.cache.has(key)) {
      logger.trace({ key }, `Cache hit`)
      return this.cache.get(key)
    }
    logger.debug({ key }, `Cache miss`)
    return undefined
  }

  public invalidateKey(key: string) {
    logger.debug({ key }, `Invalidate key`)
    this.cache.delete(key)
  }

  public setKey(key: string, content: string): void {
    logger.debug({ key }, `Set key`)
    this.cache.set(key, content)
  }
}
