import { AzureTable } from './azureTable'
import { config } from 'dotenv'
import { missing } from './utils'

config({ path: 'test.env' })

describe('asd', () => {
  const testTable = new AzureTable({
    tableName: 'statestore',
    accountKey: process.env.ACCOUNT_KEY ?? missing('ACCOUNT_KEY'),
    accountName: process.env.ACCOUNT_NAME ?? missing('ACCOUNT_NAME'),
  })


  it('should be called', async () => {
    // await sd.retrieveEntity('1234', 'book')

    expect(true).toBeTruthy()
  })
})
