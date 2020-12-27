import * as azure from '@pulumi/azure'
import { onPDFupload } from './onBlobUpload'
import * as fs from 'fs'
import { config } from 'dotenv'
import { AzureTable } from './azure/azureTable'

config({ path: 'test.env' })

describe('onBlobUpload', () => {
  const testParitionKey = '1609089255445'
  const testRowKey = 'bill'
  const dt = new Date()
  const testTable = new AzureTable({
    tableName: process.env.TABLE_NAME ?? '',
    accountKey: process.env.STORAGE_ACCOUNT_KEY ?? '',
    accountName: process.env.STORAGE_ACCOUNT_NAME ?? '',
  })
  beforeAll(async () => {
    await testTable.insertEntity({
      partitionKey: testParitionKey,
      rowKey: testRowKey,
      updatedAt: dt,
      insertedAt: dt,
      state: 'pdf-knowledge-source-requested',
    })
  })

  afterAll(async () => {
    await testTable.deleteEntity(testParitionKey, testRowKey)
  })

  it('should process pdf file', async () => {
    const pdfContent = fs.readFileSync('./test/bill.pdf')
    const ctx = {
      bindingData: {
        blobTrigger: './test/1609089255445-bill.pdf'
      },
      log: {
        info: console.log
      }
    } as azure.storage.BlobContext

    await onPDFupload(ctx, pdfContent)
  })
})
