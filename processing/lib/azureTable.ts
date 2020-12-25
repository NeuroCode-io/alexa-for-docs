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

type AzureTableEntity = {
  PartitionKey: { $: string; _: string }
  RowKey: { $: string; _: string }
  Timestamp?: { $: string; _: Date }
  state: { _: ProcessingState }
  insertedAt: { $: string; _: Date }
  updatedAt: { $: string; _: Date }
  '.metadata'?: {
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
  etag?: string
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

  async retrieveEntity<T>(partitionKey: string, rowKey: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.service.retrieveEntity(this.tableName, partitionKey, rowKey, (error, result: T) => {
        if (error) return reject(error)

        resolve(result)
      })
    })
  }

  async insertEntity(entity: Entity): Promise<void> {
    return new Promise((resolve, reject) => {
      const azEntity = {
        PartitionKey: {
          $: 'Edm.String',
          _: entity.partitionKey,
        },
        RowKey: {
          $: 'Edm.String',
          _: entity.rowKey,
        },
        state: {
          _: entity.state,
        },
        insertedAt: {
          $: 'Edm.DateTime',
          _: entity.insertedAt,
        },
        updatedAt: {
          $: 'Edm.DateTime',
          _: entity.updatedAt,
        },
      }

      this.service.insertEntity<AzureTableEntity>(this.tableName, azEntity, { echoContent: false }, (error) => {
        if (error) return reject(error)

        resolve()
      })
    })
  }

  async deleteEntity(partitionKey: string, rowKey: string): Promise<void> {
    const azEntity = {
      PartitionKey: {
        $: 'Edm.String',
        _: partitionKey,
      },
      RowKey: {
        $: 'Edm.String',
        _: rowKey,
      }
    }
    return new Promise((resolve, reject) => {
      this.service.deleteEntity(this.tableName, azEntity, {}, (error) => {
        if (error) return reject(error)

        resolve()
      })
    })
  }

  async updateState(
    partitionKey: string,
    rowKey: string,
    oldState: ProcessingState,
    newState: ProcessingState
  ): Promise<void> {
    const oldEntity = await this.retrieveEntity<AzureTableEntity>(partitionKey, rowKey)
    const { state, updatedAt, ...rest } = oldEntity

    if (state['_'] !== oldState) {
      throw new Error(`IllegalState: Received ${state['_']} but wanted ${oldState}`)
    }

    return new Promise((resolve, reject) => {
      const newEntity = {
        ...rest,
        state: { ...state, _: newState },
        updatedAt: { ...updatedAt, _: new Date().toISOString() },
      }

      this.service.replaceEntity(this.tableName, newEntity, (error) => {
        if (error) return reject(error)

        resolve()
      })
    })
  }
}
