import { isSentence, keysFromFileName, missing } from './utils'

describe('utils', () => {
  describe('isSentence', () => {
    const testCases = [
      ['Hello world with no digitis at all should always return true', true],
      ['Hello 1 2 3 world', false],
      ['Hello world awesome 1', true],
      ['shortsentence is false', false],
      ['1 hello long sentence 2 with 3 too 1 many 2 digits', false],
    ]
    it.each(testCases)('isSentence(%s) should be %s', (sentence, expected) => {
      expect(isSentence(sentence as string)).toBe(expected)
    })
  })

  describe('keysFromFileName', () => {
    const testCases = [
      ['/home/someone/somewhere/1234-book.pdf', { partitionKey: '1234', rowKey: 'book', fileName: '1234-book.pdf' }],
      [
        '/home/someone/somewhere/1234-book.tar.gz',
        { partitionKey: '1234', rowKey: 'book.tar', fileName: '1234-book.tar.gz' },
      ],
      [
        '/home/someone/somewhere/1234-book-with-alot-of-hyphens.pdf',
        { partitionKey: '1234', rowKey: 'book-with-alot-of-hyphens', fileName: '1234-book-with-alot-of-hyphens.pdf' },
      ],
    ]
    it.each(testCases)('should parse keys from filename', (filePath, expected) => {
      expect(keysFromFileName(filePath as string)).toEqual(expected)
    })
  })

  describe('missing', () => {
    it('should always thorw with key input in error message', () => {
      expect(() => missing('foo')).toThrowError('foo app setting missing')
    })
  })
})