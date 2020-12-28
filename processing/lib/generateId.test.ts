import { generateId, getRandomString } from './generateId'

describe('generateId', () => {
  describe('generateId', () => {
    it('should generate a mongo conform objectId', () => {
      const id = generateId()

      expect(id.endsWith('1')).toBeTruthy()
      expect(id.length).toEqual(24)
    })
  })
  describe('getRandomString', () => {
    it('should return a 28 long random hex string', () => {
      const randHex = getRandomString()

      expect(randHex.length).toEqual(28)
    })

    it('should return a 8 long random hex string', () => {
      const randHex = getRandomString(4)

      expect(randHex.length).toEqual(8)
    })
  })
})
