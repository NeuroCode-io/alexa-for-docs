import * as azure from '@pulumi/azure'
import * as search from './azure/searchService'
import * as fs from 'fs'
import { AzureTable } from './azure/azureTable'
import { onJsonUpload } from './onJsonUpload'
import { config } from 'dotenv'

config({ path: 'test.env' })

describe('onJsonUpload', () => {
  let mockSaveDocs = jest.fn()
  const testParitionKey = '1609089255447'
  const testRowKey = 'bill.pdf'
  const dt = new Date()
  const testTable = new AzureTable({
    tableName: process.env.TABLE_NAME ?? '',
    accountKey: process.env.STORAGE_ACCOUNT_KEY ?? '',
    accountName: process.env.STORAGE_ACCOUNT_NAME ?? '',
  })

  beforeEach(async () => {
    //@ts-ignore
    search.saveDocuments = mockSaveDocs
    await testTable.insertEntity({
      partitionKey: testParitionKey,
      rowKey: testRowKey,
      updatedAt: dt,
      insertedAt: dt,
      state: 'pdf-knowledge-source-processed',
    })
  })

  afterEach(async () => {
    await testTable.deleteEntity(testParitionKey, testRowKey)
    jest.restoreAllMocks()
    jest.resetModules()
  })

  it('should process json file', async () => {
    const jsonContent = fs.readFileSync('./test/book.json')
    const ctx = {
      bindingData: {
        blobTrigger: `./test/${testParitionKey}-${testRowKey}`,
      },
      log: {
        info: console.log,
        warn: console.log,
      },
    } as azure.storage.BlobContext

    await onJsonUpload(ctx, jsonContent)

    expect(mockSaveDocs).toHaveBeenCalledTimes(1)
    //Number of pages = 219
    expect(mockSaveDocs.mock.calls[0][0].length).toBe(219)
  })
})
