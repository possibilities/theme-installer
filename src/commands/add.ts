import { exec } from 'child_process'
import { promisify } from 'util'
import prompts from 'prompts'
import { checkGitStatus } from '../utils/git.js'
import { fetchThemeData, extractFontsFromTheme } from '../utils/theme.js'
import {
  filterValidGoogleFonts,
  fetchEditorFontWeights,
} from '../utils/fonts.js'
import { updateLayoutWithFonts } from '../utils/layout.js'
import {
  isValidNextJsProject,
  getNextJsValidationError,
} from '../utils/nextjs.js'

const execAsync = promisify(exec)

export interface AddOptions {
  yes?: boolean
}

export async function addTheme(themeName: string, options: AddOptions) {
  try {
    if (!isValidNextJsProject()) {
      console.error(`\n❌ ${getNextJsValidationError()}`)
      process.exit(1)
    }

    console.log('Checking git status...')
    await checkGitStatus()

    if (!options.yes) {
      const { proceed } = await prompts({
        type: 'confirm',
        name: 'proceed',
        message: `Add theme "${themeName}" and update layout with fonts?`,
        initial: true,
      })

      if (!proceed) {
        console.log('Operation cancelled')
        return
      }
    }

    console.log(`\nAdding theme: ${themeName}`)
    console.log('Running shadcn command...')

    const shadcnCommand = `pnpm dlx shadcn@latest add https://tweakcn.com/r/themes/${themeName}.json --yes`

    try {
      const { stdout, stderr } = await execAsync(shadcnCommand)
      if (stdout) console.log(stdout)
      if (stderr) console.error(stderr)
    } catch (error: any) {
      throw new Error(`Failed to run shadcn command: ${error.message}`)
    }

    console.log('\nFetching theme data...')
    const themeData = await fetchThemeData(themeName)

    console.log('Extracting fonts from theme...')
    const fonts = extractFontsFromTheme(themeData)

    if (fonts.size === 0) {
      console.log('No custom fonts found in theme')
      return
    }

    console.log(`Found ${fonts.size} font(s): ${Array.from(fonts).join(', ')}`)

    console.log('\nFetching font weights from editor...')
    const fontWeights = await fetchEditorFontWeights()

    console.log('\nValidating fonts against Google Fonts...')
    const validFonts = await filterValidGoogleFonts(fonts, fontWeights)

    if (validFonts.length === 0) {
      console.log('No Google Fonts found in theme')
      return
    }

    console.log(`Valid Google Fonts: ${validFonts.map(f => f.name).join(', ')}`)

    console.log('\nUpdating layout file...')
    await updateLayoutWithFonts(validFonts)

    console.log('\n✅ Theme added successfully!')
    console.log(`Theme: ${themeData.title || themeName}`)
    console.log(`Fonts added: ${validFonts.map(f => f.name).join(', ')}`)
  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}
