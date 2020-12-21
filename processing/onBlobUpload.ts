import * as azure from '@pulumi/azure'
import { getText } from './pdf'
import * as fileType from 'file-type'
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob'
import { getRandomString } from './lib/generateId'
import { reportError } from './lib/slack'
import { keysFromFileName, missing } from './lib/utils'
import { AzureTable } from './lib/azureTable'
import { ProcessedJson } from './types'

const maxSizeMB = 30

const onPDFupload = async (ctx: azure.storage.BlobContext, arg: Buffer) => {
  try {
    const opts = {
      accountName: process.env.STORAGE_ACCOUNT_NAME ?? missing('STORAGE_ACCOUNT_NAME'),
      accountKey: process.env.STORAGE_ACCOUNT_KEY ?? missing('STORAGE_ACCOUNT_NAME'),
      containerName: process.env.STORAGE_CONTAINER_NAME ?? missing('STORAGE_CONTAINER_NAME'),
    }

    const tableService = new AzureTable({
      accountKey: opts.accountKey,
      accountName: opts.accountName,
      tableName: 'statestore',
    })

    const { fileName, partitionKey, rowKey } = keysFromFileName(ctx.bindingData.blobTrigger)

    await tableService.updateState(
      partitionKey,
      rowKey,
      'pdf-knowledge-source-requested',
      'pdf-knowledge-source-uploaded'
    )

    const sharedKeyCredential = new StorageSharedKeyCredential(opts.accountName, opts.accountKey)
    const blobServiceClient = new BlobServiceClient(
      `https://${opts.accountName}.blob.core.windows.net`,
      sharedKeyCredential
    )

    ctx.log.info(`Processing ${fileName}`)
    const size = Buffer.byteLength(arg) / 1e6

    const fileExt = await fileType.fromBuffer(arg)
    if (!fileExt?.mime.toLocaleLowerCase().includes('pdf')) {
      ctx.log.warn(`File: ${fileName} is not of pdf type. Wont parse it`)
      return
    }
    if (size > maxSizeMB) {
      ctx.log.warn(`File: ${fileName} is too large. Wont parse it`)
      return
    }

    let result: ProcessedJson[] = []
    for await (const obj of getText(arg)) {
      result.push({
        id: getRandomString(),
        page: obj.page,
        content: obj.content,
        fileName,
      })
    }

    const containerClient = blobServiceClient.getContainerClient(opts.containerName)
    const blobClient = containerClient.getBlockBlobClient(`${rowKey}.json`)
    const content = Buffer.from(JSON.stringify({ result }))

    await blobClient.upload(content, Buffer.byteLength(content))
    await tableService.updateState(
      partitionKey,
      rowKey,
      'pdf-knowledge-source-uploaded',
      'pdf-knowledge-source-processed'
    )

    ctx.log.info(`Processing ${fileName} done`)
  } catch (error) {
    await reportError(error)
  }
}

export { onPDFupload }
