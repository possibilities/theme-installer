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

function cleanupExistingFontLines(content: string, fontName: string): string {
  let cleanedContent = content

  const preconnectGoogleApisPattern =
    /<link\s+rel=['"']preconnect['"']\s+href=['"']https:\/\/fonts\.googleapis\.com['"']\s*\/?>[\s\n]*/gi
  cleanedContent = cleanedContent.replace(preconnectGoogleApisPattern, '')

  const preconnectGstaticPattern =
    /<link\s+[^>]*rel=['"']preconnect['"'][^>]*href=['"']https:\/\/fonts\.gstatic\.com['"'][^>]*>[\s\n]*/gi
  cleanedContent = cleanedContent.replace(preconnectGstaticPattern, '')

  const chatGptCommentPattern =
    /\s*\{?\/\*\s*See:\s*https:\/\/chatgpt\.com\/c\/[^*]+\*\/\}?[\s\n]*/gi
  cleanedContent = cleanedContent.replace(chatGptCommentPattern, '')

  const eslintCommentPattern =
    /\s*\{?\/\*\s*eslint-disable[^*]+\*\/\}?[\s\n]*/gi
  cleanedContent = cleanedContent.replace(eslintCommentPattern, '')

  const escapedFontName = fontName.replace(/\s+/g, '\\+?')
  const fontLinkPattern = new RegExp(
    `<link[^>]*href=['"']https:\\/\\/fonts\\.googleapis\\.com\\/css2\\?[^'"]*family=${escapedFontName}[^'"]*['"'][^>]*>[\\s\\n]*`,
    'gi',
  )
  cleanedContent = cleanedContent.replace(fontLinkPattern, '')

  return cleanedContent
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
    updatedContent = cleanupExistingFontLines(updatedContent, font.name)

    const fontTag = generateFontLinkTag(font)
    const headClosePattern = /<\/head>/i

    if (headClosePattern.test(updatedContent)) {
      updatedContent = updatedContent.replace(
        headClosePattern,
        `${fontTag}\n      </head>`,
      )
      console.log(`Added font links for: ${font.name}`)
    } else {
      throw new Error('Could not find </head> tag in layout file')
    }
  }

  await fs.writeFile(layoutPath, updatedContent)
  console.log(`Updated ${layoutPath} with font links`)
}
