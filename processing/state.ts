import * as verify from './verify'
import { AzureTable } from './azure/azureTable'

type StateStoreInput = {
  accountName: string
  accountKey: string
  tableName: string
}

class StateStore {
  private tableService: AzureTable
  constructor(private readonly partitionKey: string, private readonly rowKey: string, storeInput?: StateStoreInput) {
    const opts = storeInput ?? verify.settings()
    this.tableService = new AzureTable({
      accountKey: opts.accountKey,
      accountName: opts.accountName,
      tableName: 'statestore',
    })
  }

  async fileTooLarge() {
    await this.tableService.updateState(
      this.partitionKey,
      this.rowKey,
      'pdf-knowledge-source-too-large',
      'pdf-knowledge-source-requested'
    )
  }

  async notPDFtype() {
    await this.tableService.updateState(
      this.partitionKey,
      this.rowKey,
      'pdf-knowledge-source-incompatible-type',
      'pdf-knowledge-source-requested'
    )
  }

  async pdfFileUploaded() {
    await this.tableService.updateState(
      this.partitionKey,
      this.rowKey,
      'pdf-knowledge-source-uploaded',
      'pdf-knowledge-source-requested'
    )
  }

  async knowledgeSourceProcessed() {
    await this.tableService.updateState(
      this.partitionKey,
      this.rowKey,
      'pdf-knowledge-source-processed',
      'pdf-knowledge-source-uploaded'
    )
  }

  async jsonFileUploaded() {
    await this.tableService.updateState(
      this.partitionKey,
      this.rowKey,
      'json-file-uploaded',
      'pdf-knowledge-source-processed'
    )
  }

  async finished() {
    await this.tableService.updateState(this.partitionKey, this.rowKey, 'json-file-processed', 'json-file-uploaded')
  }

  async internalError() {
    await this.tableService.updateState(this.partitionKey, this.rowKey, 'internal-error')
  }
}

export { StateStore }
