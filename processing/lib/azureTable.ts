import { TableService, ExponentialRetryPolicyFilter } from 'azure-storage'
import { ProcessingState } from '../types'

const retryCount = 3
const retryIntervalMilliseconds = 5000
const minRetryIntervalMilliseconds = 1000
const maxRetryIntervalMilliseconds = 10000

type AzureTableInput = {
  tableName: string
  accountName: string
  accountKey: string
}

type AzureEntityOutput = {
  PartitionKey: { $: string; _: string }
  RowKey: { $: string; _: string }
  Timestamp: { $: string; _: Date }
  state: { _: ProcessingState }
  insertedAt: { $: string; _: Date }
  updatedAt: { $: string; _: Date }
  '.metadata': {
    metadata: string
    etag: string
  }
}

type Entity = {
  state: ProcessingState
  insertedAt: Date
  updatedAt: Date
  partitionKey: string
  rowKey: string
  etag: string
}


export class AzureTable {
  private readonly tableName: string
  private readonly service: TableService
  constructor(opts: AzureTableInput) {
    this.tableName = opts.tableName
    this.service = new TableService(opts.accountName, opts.accountKey).withFilter(
      new ExponentialRetryPolicyFilter(
        retryCount,
        retryIntervalMilliseconds,
        minRetryIntervalMilliseconds,
        maxRetryIntervalMilliseconds
      )
    )
  }

  async retrieveEntity(partitionKey: string, rowKey: string) {
    return new Promise<Entity>((resolve, reject) => {
      this.service.retrieveEntity(this.tableName, partitionKey, rowKey, (error, result: AzureEntityOutput) => {
        if (error) return reject(error)

        const {
          PartitionKey: { _: partitionKey },
          RowKey: { _: rowKey },
          state: { _: state },
          insertedAt: { _: insertedAt },
          updatedAt: { _: updatedAt },
        } = result
        const etag = result['.metadata'].etag

        resolve({ partitionKey, rowKey, state, insertedAt, updatedAt, etag })
      })
    })
  }

  async updateState(partitionKey: string, rowKey: string, oldState: ProcessingState, newState: ProcessingState) {
    const oldEntity = await this.retrieveEntity(partitionKey, rowKey)
    if (oldEntity.state !== oldState) {
      throw new Error(`IllegalState: Received ${oldEntity.state} but wanted ${oldState}`)
    }

    return new Promise((resolve, reject) => {
      const dt = new Date()
      const newEntity = { state: newState, updatedAt: dt.toISOString(), '.metadata': { etag: oldEntity.etag } }

      this.service.replaceEntity(this.tableName, newEntity, (error) => {
        if (error) return reject(error)

        resolve({})
      })
    })
  }
}
