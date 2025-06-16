import fetch from 'node-fetch'
import fs from 'fs/promises'
import path from 'path'

export interface GoogleFont {
  name: string
  weights: string
}

export async function fetchEditorFontWeights(): Promise<Map<string, string>> {
  const editorUrl = 'https://tweakcn.com/editor/theme'

  try {
    const response = await fetch(editorUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch editor page: ${response.statusText}`)
    }

    const html = await response.text()

    const googleFontsUrlMatch = html.match(
      /https:\/\/fonts\.googleapis\.com\/css2\?[^"']+/,
    )
    if (!googleFontsUrlMatch) {
      throw new Error('Could not find Google Fonts URL in editor page')
    }

    const googleFontsUrl = googleFontsUrlMatch[0].replace(/&amp;/g, '&')

    return parseFontWeightsFromUrl(googleFontsUrl)
  } catch (error: any) {
    throw new Error(`Failed to fetch font weights: ${error.message}`)
  }
}

export function parseFontWeightsFromUrl(url: string): Map<string, string> {
  const fontWeights = new Map<string, string>()

  const urlParams = new URL(url).searchParams
  const familyParams = urlParams.getAll('family')

  for (const familyParam of familyParams) {
    const colonIndex = familyParam.indexOf(':')

    if (colonIndex === -1) {
      const fontName = familyParam.replace(/\+/g, ' ')
      fontWeights.set(fontName, '')
    } else {
      const fontName = familyParam.substring(0, colonIndex).replace(/\+/g, ' ')
      const weightSpec = familyParam.substring(colonIndex + 1)
      fontWeights.set(fontName, weightSpec)
    }
  }

  return fontWeights
}

export async function validateGoogleFont(fontName: string): Promise<boolean> {
  const urlSafeName = fontName.replace(/\s+/g, '+')
  const testUrl = `https://fonts.googleapis.com/css2?family=${urlSafeName}&display=optional`

  try {
    const response = await fetch(testUrl, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

export async function filterValidGoogleFonts(
  fonts: Set<string>,
  fontWeights: Map<string, string>,
): Promise<GoogleFont[]> {
  const validFonts: GoogleFont[] = []

  for (const font of fonts) {
    const isValid = await validateGoogleFont(font)

    if (isValid) {
      let weights = fontWeights.get(font)

      if (!weights) {
        const fontWithPlus = font.replace(/\s+/g, '+')
        weights = fontWeights.get(fontWithPlus)
      }

      if (!weights) {
        const fontWithSpace = font.replace(/\+/g, ' ')
        weights = fontWeights.get(fontWithSpace)
      }

      if (!weights) {
        console.log(`Skipping system font (no weights found): ${font}`)
        continue
      }

      validFonts.push({
        name: font,
        weights,
      })
    } else {
      console.log(`Skipping system font (not in Google Fonts): ${font}`)
    }
  }

  return validFonts
}

export function generateGoogleFontUrl(font: GoogleFont): string {
  const urlSafeName = font.name.replace(/\s+/g, '+')
  return `https://fonts.googleapis.com/css2?family=${urlSafeName}:${font.weights}&display=optional`
}

export function generateFontLinkTag(font: GoogleFont): string {
  const url = generateGoogleFontUrl(font)
  return `
      <link rel='preconnect' href='https://fonts.googleapis.com' />
      <link
        rel='preconnect'
        href='https://fonts.gstatic.com'
        crossOrigin='anonymous'
      />
      {/* See: https://chatgpt.com/c/681ca606-b550-8001-88c7-84fe99e7dcaf */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href='${url}'
        rel='stylesheet'
      />`
}
