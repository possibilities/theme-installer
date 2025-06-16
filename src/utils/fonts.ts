import fetch from 'node-fetch'
import fs from 'fs/promises'
import path from 'path'

export interface GoogleFont {
  name: string
  weights: string
}

export async function validateGoogleFont(fontName: string): Promise<boolean> {
  const urlSafeName = fontName.replace(/\s+/g, '+')
  const testUrl = `https://fonts.googleapis.com/css2?family=${urlSafeName}:wght@100..900&display=optional`

  try {
    const response = await fetch(testUrl, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

export async function filterValidGoogleFonts(
  fonts: Set<string>,
): Promise<GoogleFont[]> {
  const validFonts: GoogleFont[] = []

  for (const font of fonts) {
    const isValid = await validateGoogleFont(font)

    if (isValid) {
      validFonts.push({
        name: font,
        weights: 'wght@100..900',
      })
    } else {
      console.log(`Skipping non-Google font: ${font}`)
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
