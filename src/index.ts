import { Command } from 'commander'
import packageJson from '../package.json' assert { type: 'json' }
import { addTheme } from './commands/add.js'

async function main() {
  const program = new Command()

  program
    .name('theme-installer')
    .description('Install tweakcn themes with automatic font setup for Next.js')
    .version(packageJson.version)

  program
    .command('add <theme>')
    .description('Add a tweakcn theme and update layout with required fonts')
    .option('-y, --yes', 'Skip confirmation prompts')
    .action(async (theme, options) => {
      await addTheme(theme, options)
    })

  program.command('*', { hidden: true }).action(() => {
    console.error('Unknown command. Use --help to see available commands.')
    process.exit(1)
  })

  try {
    program.exitOverride()
    program.configureOutput({
      writeErr: str => process.stderr.write(str),
    })

    await program.parseAsync(process.argv)
  } catch (error: any) {
    if (
      error.code === 'commander.help' ||
      error.code === 'commander.helpDisplayed'
    ) {
      process.exit(0)
    }
    console.error('Error:', error.message || error)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
