import * as azure from '@pulumi/azure'
import { getText } from './pdf'
import * as fileType from 'file-type'
import * as path from 'path'
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob'
import { getRandomString } from './lib/generateId'
import { reportError } from './lib/slack'

const maxSizeMB = 30

const onPDFupload = async (ctx: azure.storage.BlobContext, arg: Buffer) => {
  try {
    const opts = {
      accountName: process.env.STORAGE_ACCOUNT_NAME,
      accountKey: process.env.STORAGE_ACCOUNT_KEY,
      containerName: process.env.STORAGE_CONTAINER_NAME,
    }

    if (!opts.accountKey || !opts.accountName || !opts.containerName) throw new Error('App Settings missing')

    const sharedKeyCredential = new StorageSharedKeyCredential(opts.accountName, opts.accountKey)
    const blobServiceClient = new BlobServiceClient(
      `https://${opts.accountName}.blob.core.windows.net`,
      sharedKeyCredential
    )

    const filePath = ctx.bindingData.blobTrigger
    ctx.log.info(`Processing ${filePath}`)
    const size = Buffer.byteLength(arg) / 1e6

    const fileExt = await fileType.fromBuffer(arg)
    if (!fileExt?.mime.toLocaleLowerCase().includes('pdf')) {
      ctx.log.warn(`File: ${filePath} is not of pdf type. Wont parse it`)
      return
    }
    if (size > maxSizeMB) {
      ctx.log.warn(`File: ${filePath} is too large. Wont parse it`)
      return
    }

    const result = []
    const fileName = path.basename(filePath)
    for await (const obj of getText(arg)) {
      result.push({
        id: getRandomString(),
        page: obj.page,
        content: obj.content,
        fileName,
      })
    }

    const containerClient = blobServiceClient.getContainerClient(opts.containerName)
    const blobClient = containerClient.getBlockBlobClient(fileName.replace('pdf', 'json'))
    const content = Buffer.from(JSON.stringify({ result }))

    await blobClient.upload(content, Buffer.byteLength(content))

    ctx.log.info(`Processing ${filePath} done`)
  } catch (error) {
    await reportError(error)
  }
}

export { onPDFupload }
