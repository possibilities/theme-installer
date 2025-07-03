import fs from 'fs/promises'
import { GoogleFont, generateCombinedFontLinkTag } from './fonts.js'

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

function cleanupExistingFontLines(content: string): string {
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

  const fontLinkPattern =
    /<link[^>]*href=['"']https:\/\/fonts\.googleapis\.com\/css2\?[^'"]+['"'][^>]*>[\s\n]*/gi
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

  let updatedContent = cleanupExistingFontLines(content)

  const fontTag = generateCombinedFontLinkTag(fonts)
  const headClosePattern = /<\/head>/i
  const bodyOpenPattern = /<body[^>]*>/i

  if (headClosePattern.test(updatedContent)) {
    updatedContent = updatedContent.replace(
      headClosePattern,
      `\n      ${fontTag}\n      </head>`,
    )
    const fontNames = fonts.map(font => font.name).join(', ')
    console.log(`Added combined font links for: ${fontNames}`)
  } else if (bodyOpenPattern.test(updatedContent)) {
    const headTagWithFonts = `<head>\n      ${fontTag}\n    </head>\n    `
    updatedContent = updatedContent.replace(
      bodyOpenPattern,
      match => `${headTagWithFonts}${match}`,
    )
    const fontNames = fonts.map(font => font.name).join(', ')
    console.log(`Added <head> tag with combined font links for: ${fontNames}`)
  } else {
    throw new Error('Could not find </head> tag or <body> tag in layout file')
  }

  await fs.writeFile(layoutPath, updatedContent)
  console.log(`Updated ${layoutPath} with font links`)
}
