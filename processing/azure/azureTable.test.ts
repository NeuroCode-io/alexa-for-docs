import { AzureTable } from './azureTable'
import { config } from 'dotenv'

config({ path: 'test.env' })

describe('azureTable', () => {
  const testParitionKey = '12123'
  const testRowKey = 'book'
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

  it('should retrieveEntity', async () => {
    const entity = await testTable.retrieveEntity(testParitionKey, testRowKey)

    expect(entity).toHaveProperty('PartitionKey')
  })

  it('should throw retrieveEntity if not exists', async () => {
    await expect(testTable.retrieveEntity('doesnotexist', testRowKey)).rejects.toThrow()
  })

  it('should throw insertEntity if exists', async () => {
    await expect(
      testTable.insertEntity({
        partitionKey: testParitionKey,
        rowKey: testRowKey,
        updatedAt: dt,
        insertedAt: dt,
        state: 'pdf-knowledge-source-processed',
      })
    ).rejects.toThrow()
  })

  it('should updateState', async () => {
    await testTable.updateState(
      testParitionKey,
      testRowKey,
      'pdf-knowledge-source-uploaded',
      'pdf-knowledge-source-requested'
    )
  })

  it('should not update state if oldState is wrong', async () => {
    await expect(
      testTable.updateState(testParitionKey, testRowKey, 'json-file-uploaded', 'json-file-processed')
    ).rejects.toThrow()
  })
})
