const isSentence = (sentence: string) => {
  const words = sentence.split(' ')
  if (words.length <= 3) return false

  const numberOfWordsWithDigits = words.map(word => [...word].some(i => Number.isFinite(-i))).filter(s => s).length

  // are 40% of the words in the sentence with digits
  return numberOfWordsWithDigits / words.length >= 0.4 ? false : true
}

export { isSentence }
