/**
 * 简单 logger(后续可换 pino / winston transport)。
 * 生产不打印敏感字段(预留脱敏点)。
 */
const ts = () => new Date().toISOString()

function fmt(level: string, msg: string, meta?: unknown) {
  const metaStr = meta ? ' ' + JSON.stringify(meta) : ''
  return `[${ts()}] ${level} ${msg}${metaStr}`
}

export const logger = {
  info: (msg: string, meta?: unknown) => console.log(fmt('INFO ', msg, meta)),
  warn: (msg: string, meta?: unknown) => console.warn(fmt('WARN ', msg, meta)),
  error: (msg: string, meta?: unknown) => console.error(fmt('ERROR', msg, meta)),
  debug: (msg: string, meta?: unknown) => {
    if (process.env.NODE_ENV !== 'production') console.log(fmt('DEBUG', msg, meta))
  },
}
