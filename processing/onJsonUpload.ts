import * as azure from '@pulumi/azure'
import { SearchClient, AzureKeyCredential } from '@azure/search-documents'
import { reportError } from './lib/slack'
import { AzureTable } from './lib/azureTable'
import { chunk } from './lib/array'
import { keysFromFileName, missing, cleanText } from './lib/utils'
import { ProcessedJson } from './types'

const clean = (data: ProcessedJson[]) => data.map((d) => ({ ...d, content: cleanText(d.content) }))

const onJsonUpload = async (ctx: azure.storage.BlobContext, arg: Buffer) => {
  try {
    const opts = {
      accountName: process.env.STORAGE_ACCOUNT_NAME ?? missing('STORAGE_ACCOUNT_NAME'),
      accountKey: process.env.STORAGE_ACCOUNT_KEY ?? missing('STORAGE_ACCOUNT_KEY'),
      apiKey: process.env.SEARCH_SERIVCE_KEY ?? missing('SEARCH_SERIVCE_KEY'),
      searchServiceName: process.env.SEARCH_SERVICE_NAME ?? missing('SEARCH_SERVICE_NAME'),
    }

    const tableService = new AzureTable({
      accountKey: opts.accountKey,
      accountName: opts.accountName,
      tableName: 'statestore',
    })
    const { fileName, partitionKey, rowKey } = keysFromFileName(ctx.bindingData.blobTrigger)

    await tableService.updateState(partitionKey, rowKey, 'pdf-knowledge-source-processed', 'json-file-uploaded')

    ctx.log.info(`Processing ${fileName}`)

    const client = new SearchClient(
      `https://${opts.searchServiceName}.search.windows.net`,
      'neurocode-uploads',
      new AzureKeyCredential(opts.apiKey)
    )

    let data = null
    try {
      const { result } = JSON.parse(arg.toString())
      data = result as ProcessedJson[]
    } catch (err) {
      ctx.log.warn('Corrupt file')
    }

    if (!Array.isArray(data)) throw new Error('Parsing error. Received corrupted JSON')

    const chunkedDocs = chunk(clean(data), 500)

    for (const c of chunkedDocs) {
      await client.uploadDocuments(c)
    }

    await tableService.updateState(partitionKey, rowKey, 'json-file-uploaded', 'json-file-processed')

    ctx.log.info(`Processing ${fileName} done`)
  } catch (error) {
    await reportError(error)
  }
}

export { onJsonUpload }
