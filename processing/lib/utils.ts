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
  const fileName = path.basename(filePath)
  const [partitionKey, ...rest] = path.parse(fileName).name.split('-')
  const rowKey = rest.join('-')

  return {
    partitionKey, rowKey, fileName
  }
}

const missing = (key: string) => {
  throw new Error(`${key} app setting missing`)
}

export { isSentence, keysFromFileName, missing }
