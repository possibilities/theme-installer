import fetch from 'node-fetch'

interface FontVars {
  'font-sans': string
  'font-mono': string
  'font-serif': string
}

interface ThemeCssVars {
  theme: FontVars
  dark?: FontVars
  light?: FontVars
}

interface ThemeData {
  name: string
  title: string
  description: string
  cssVars: ThemeCssVars
}

export async function fetchThemeRegistry(): Promise<ThemeData[]> {
  const response = await fetch('https://tweakcn.com/r/registry.json')
  if (!response.ok) {
    throw new Error(`Failed to fetch registry: ${response.statusText}`)
  }

  const data = (await response.json()) as ThemeData[]
  return data
}

export async function fetchThemeData(themeName: string): Promise<ThemeData> {
  const response = await fetch(`https://tweakcn.com/r/themes/${themeName}.json`)
  if (!response.ok) {
    throw new Error(
      `Failed to fetch theme ${themeName}: ${response.statusText}`,
    )
  }

  const data = (await response.json()) as ThemeData
  return data
}

export function extractFontsFromTheme(theme: ThemeData): Set<string> {
  const fonts = new Set<string>()

  const addFontsFromVars = (vars: FontVars) => {
    const fontProperties = ['font-sans', 'font-mono', 'font-serif'] as const

    for (const prop of fontProperties) {
      if (vars[prop]) {
        const fontStack = vars[prop].split(',').map(f => f.trim())

        for (const font of fontStack) {
          const cleanFont = font.replace(/['"]/g, '').trim()
          if (cleanFont) {
            fonts.add(cleanFont)
          }
        }
      }
    }
  }

  if (theme.cssVars.theme) {
    addFontsFromVars(theme.cssVars.theme)
  }

  if (theme.cssVars.light) {
    addFontsFromVars(theme.cssVars.light)
  }

  if (theme.cssVars.dark) {
    addFontsFromVars(theme.cssVars.dark)
  }

  return fonts
}
