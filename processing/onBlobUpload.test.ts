import * as azure from '@pulumi/azure'
import { onPDFupload } from './onBlobUpload'
import * as blob from './azure/blob'
import * as fs from 'fs'
import { config } from 'dotenv'
import { AzureTable } from './azure/azureTable'

config({ path: 'test.env' })

describe('onBlobUpload', () => {
  let mockUpload = jest.fn()
  const testParitionKey = '1609089255445'
  const testRowKey = 'bill'
  const dt = new Date()
  const testTable = new AzureTable({
    tableName: process.env.TABLE_NAME ?? '',
    accountKey: process.env.STORAGE_ACCOUNT_KEY ?? '',
    accountName: process.env.STORAGE_ACCOUNT_NAME ?? '',
  })
  beforeEach(async () => {
    //@ts-ignore
    blob.uploadJsonFile = mockUpload
    await testTable.insertEntity({
      partitionKey: testParitionKey,
      rowKey: testRowKey,
      updatedAt: dt,
      insertedAt: dt,
      state: 'pdf-knowledge-source-requested',
    })
  })

  afterEach(async () => {
    await testTable.deleteEntity(testParitionKey, testRowKey)
    jest.restoreAllMocks()
    jest.resetModules()
  })

  it('should process pdf file', async () => {
    const pdfContent = fs.readFileSync('./test/bill.pdf')
    const ctx = {
      bindingData: {
        blobTrigger: `./test/${testParitionKey}-${testRowKey}.pdf`,
      },
      log: {
        info: console.log,
      },
    } as azure.storage.BlobContext

    await onPDFupload(ctx, pdfContent)

    expect(mockUpload).toHaveBeenCalledWith('1609089255445-bill.json', expect.anything())
  })
})
