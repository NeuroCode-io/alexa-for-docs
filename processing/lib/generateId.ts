import { randomBytes } from 'crypto'

const PROCESS_UNIQUE = randomBytes(5)
let inc = 0

const newInc = () => (inc = (inc + 1) % 0xffffff)

const generateId = () => {
  newInc()
  const time = ~~(Date.now() / 1000)
  const buffer = Buffer.alloc(12)

  // 4-byte timestamp
  buffer[3] = time & 0xff
  buffer[2] = (time >> 8) & 0xff
  buffer[1] = (time >> 16) & 0xff
  buffer[0] = (time >> 24) & 0xff

  // 5-byte process unique
  buffer[4] = PROCESS_UNIQUE[0]
  buffer[5] = PROCESS_UNIQUE[1]
  buffer[6] = PROCESS_UNIQUE[2]
  buffer[7] = PROCESS_UNIQUE[3]
  buffer[8] = PROCESS_UNIQUE[4]

  // 3-byte counter
  buffer[11] = inc & 0xff
  buffer[10] = (inc >> 8) & 0xff
  buffer[9] = (inc >> 16) & 0xff

  return buffer.toString('hex')
}

const getRandomString = (length = 24) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''

  while (length > 0) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
    length--
  }
  return result
}

export { generateId, getRandomString }
