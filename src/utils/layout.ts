import fs from 'fs/promises'
import path from 'path'
import { GoogleFont, generateFontLinkTag } from './fonts.js'

async function findLayoutFile(): Promise<string | null> {
  const possiblePaths = [
    'app/layout.tsx',
    'src/app/layout.tsx',
    'app/layout.js',
    'src/app/layout.js',
  ]

  for (const layoutPath of possiblePaths) {
    try {
      await fs.access(layoutPath)
      return layoutPath
    } catch {
      continue
    }
  }

  return null
}

export async function updateLayoutWithFonts(
  fonts: GoogleFont[],
): Promise<void> {
  const layoutPath = await findLayoutFile()

  if (!layoutPath) {
    throw new Error(
      'Could not find layout.tsx or layout.js file in app directory',
    )
  }

  const content = await fs.readFile(layoutPath, 'utf-8')
  let updatedContent = content

  for (const font of fonts) {
    const fontTag = generateFontLinkTag(font)
    const escapedFontName = font.name.replace(/\s+/g, '\\+?')
    const fontBlockPattern = new RegExp(
      `(\\s*\\{/\\*[^}]*\\*/\\}\\s*\\n)?\\s*(\\{/\\*[^}]*eslint-disable[^}]*\\*/\\}\\s*\\n)?\\s*<link[^>]*href=['"]https://fonts\\.googleapis\\.com/css2\\?[^'"]*family=${escapedFontName}[^'"]*['"][^>]*>`,
      'i',
    )

    if (fontBlockPattern.test(updatedContent)) {
      updatedContent = updatedContent.replace(fontBlockPattern, fontTag.trim())
      console.log(`Updated existing font link for: ${font.name}`)
    } else {
      const headClosePattern = /<\/head>/i

      if (headClosePattern.test(updatedContent)) {
        updatedContent = updatedContent.replace(
          headClosePattern,
          `${fontTag}\n      </head>`,
        )
        console.log(`Added new font link for: ${font.name}`)
      } else {
        throw new Error('Could not find </head> tag in layout file')
      }
    }
  }

  await fs.writeFile(layoutPath, updatedContent)
  console.log(`Updated ${layoutPath} with font links`)
}
