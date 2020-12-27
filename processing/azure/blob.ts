import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob'
import { settings } from '../verify'

const uploadJsonFile = async (fileName: string, content: Buffer) => {
  if (!fileName.endsWith('json')) throw new Error(`Wrong file extension. Was expecting JSON but got ${fileName}`)

  const opts = settings()
  const sharedKeyCredential = new StorageSharedKeyCredential(opts.accountName, opts.accountKey)
  const blobServiceClient = new BlobServiceClient(
    `https://${opts.accountName}.blob.core.windows.net`,
    sharedKeyCredential
  )

  const containerClient = blobServiceClient.getContainerClient(opts.containerName)
  const blobClient = containerClient.getBlockBlobClient(fileName)

  await blobClient.upload(content, Buffer.byteLength(content))
}

export { uploadJsonFile }
