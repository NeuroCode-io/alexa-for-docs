//@ts-nocheck
import axios from 'axios'
import { reportError } from './slack'

describe('slack', () => {
  let mockedPost = jest.fn()
  const env = process.env
  beforeEach(() => {
    jest.mock('axios')
    env.SLACK_WEBHOOK = 'sd'
    axios.post = mockedPost
    jest.resetAllMocks()
    jest.resetModules()
  })

  afterEach(() => {
    process.env = env
  })


  it('should reportError', async () => {
    mockedPost.mockResolvedValue({ data: { success: true } })
    await reportError(new Error('test'))

    expect(mockedPost).toHaveBeenCalledWith('sd', expect.anything())
  })

  it('should throw if slack URL missing', () => {
    delete env['SLACK_WEBHOOK']

    expect(() => reportError(new Error('test'))).toThrow()
  })
})