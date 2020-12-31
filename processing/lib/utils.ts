import * as path from 'path'

const isSentence = (sentence: string) => {
  const words = sentence.split(' ')
  if (words.length <= 3) return false

  const isNumber = (char: String) => Number.isFinite(+char)

  const numberOfWordsWithDigits = words.map((word) => [...word].some(isNumber)).filter((s) => s).length

  // are 40% of the words in the sentence with digits
  return numberOfWordsWithDigits / words.length >= 0.4 ? false : true
}

//remove any whitespace symbols: spaces, tabs, and line breaks
const cleanText = (text: string) => text.replace(/\s+/g, ' ').trim()

const keysFromFileName = (filePath: string) => {
  const fileName = path.basename(filePath)
  const [partitionKey, ...rest] = fileName.split('-')
  const rowKey = rest.join('-')

  return {
    partitionKey,
    rowKey,
    fileName,
  }
}

const missing = (key: string) => {
  throw new Error(`${key} app setting missing`)
}

export { isSentence, keysFromFileName, cleanText, missing }
