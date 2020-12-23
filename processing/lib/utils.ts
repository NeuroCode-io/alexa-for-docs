import * as path from 'path'

const isSentence = (sentence: string) => {
  const words = sentence.split(' ')
  if (words.length <= 3) return false

  const numberOfWordsWithDigits = words.map((word) => [...word].some((i) => Number.isFinite(-i))).filter((s) => s)
    .length

  // are 40% of the words in the sentence with digits
  return numberOfWordsWithDigits / words.length >= 0.4 ? false : true
}

const keysFromFileName = (filePath: string) => {
  const { name, ext } = path.parse(filePath)
  const [partitionKey, ...rest] = name.split('-')
  const rowKey = rest.join('-')

  return {
    partitionKey, rowKey, fileName: name + ext
  }
}

const missing = (key: string) => {
  throw new Error(`${key} app setting missing`)
}

export { isSentence, keysFromFileName, missing }
