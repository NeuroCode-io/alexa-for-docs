import { isSentence } from './utils'

describe('utils', () => {
  describe('isSentence', () => {
    it('should return true for sentence that consists of < 40% digits', () => {
      expect(isSentence('Hello world with no digitis at all should always return true')).toBeTruthy()
    })

    it('should return false for sentences that consist of 40% of digits', () => {
      // 3 / 5 = 60%
      expect(isSentence('Hello 1 2 3 world')).toBeFalsy()
      expect(isSentence('Hello world 1')).toBeTruthy()
    })
  })
})