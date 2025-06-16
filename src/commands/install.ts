import { exec } from 'child_process'
import { promisify } from 'util'
import prompts from 'prompts'
import { checkGitStatus } from '../utils/git.js'
import { fetchThemeData, extractFontsFromTheme } from '../utils/theme.js'
import { filterValidGoogleFonts } from '../utils/fonts.js'
import { updateLayoutWithFonts } from '../utils/layout.js'

const execAsync = promisify(exec)

export interface InstallOptions {
  yes?: boolean
}

export async function installTheme(themeName: string, options: InstallOptions) {
  try {
    console.log('Checking git status...')
    await checkGitStatus()

    if (!options.yes) {
      const { proceed } = await prompts({
        type: 'confirm',
        name: 'proceed',
        message: `Install theme "${themeName}" and update layout with fonts?`,
        initial: true,
      })

      if (!proceed) {
        console.log('Installation cancelled')
        return
      }
    }

    console.log(`\nInstalling theme: ${themeName}`)
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

    console.log('\nValidating fonts against Google Fonts...')
    const validFonts = await filterValidGoogleFonts(fonts)

    if (validFonts.length === 0) {
      console.log('No Google Fonts found in theme')
      return
    }

    console.log(`Valid Google Fonts: ${validFonts.map(f => f.name).join(', ')}`)

    console.log('\nUpdating layout file...')
    await updateLayoutWithFonts(validFonts)

    console.log('\n✅ Theme installed successfully!')
    console.log(`Theme: ${themeData.title || themeName}`)
    console.log(`Fonts added: ${validFonts.map(f => f.name).join(', ')}`)
  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}
