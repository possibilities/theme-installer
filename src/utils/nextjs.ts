import { existsSync } from 'fs'
import { join } from 'path'

export function isValidNextJsProject(): boolean {
  const hasSrcDir = existsSync(join(process.cwd(), 'src'))
  const hasAppRouter = existsSync(join(process.cwd(), 'src', 'app'))

  return hasSrcDir && hasAppRouter
}

export function getNextJsValidationError(): string {
  return "🤔 You're ngmi if you don't use app router and a src directory?"
}
