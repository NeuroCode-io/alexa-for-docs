import { missing } from './lib/utils'
import * as fileType from 'file-type'

const settings = () => ({
  accountName: process.env.STORAGE_ACCOUNT_NAME ?? missing('STORAGE_ACCOUNT_NAME'),
  accountKey: process.env.STORAGE_ACCOUNT_KEY ?? missing('STORAGE_ACCOUNT_KEY'),
  containerName: process.env.STORAGE_CONTAINER_NAME ?? missing('STORAGE_CONTAINER_NAME'),
  searchApiKey: process.env.SEARCH_SERIVCE_KEY ?? missing('SEARCH_SERIVCE_KEY'),
  searchIndex: process.env.SEARCH_SERIVCE_INDEX ?? missing('SEARCH_SERIVCE_INDEX'),
  searchServiceName: process.env.SEARCH_SERVICE_NAME ?? missing('SEARCH_SERVICE_NAME'),
  tableName: process.env.TABLE_NAME ?? missing('TABLE_NAME'),
})

const isLargeSize = (buf: Buffer) => {
  const maxSizeMB = 30
  const sizeMB = Buffer.byteLength(buf) / 1e6

  if (sizeMB > maxSizeMB) {
    return true
  }

  return false
}

const isPDFfle = async (buf: Buffer) => {
  const fileExt = await fileType.fromBuffer(buf)
  if (!fileExt?.mime.toLocaleLowerCase().includes('pdf')) {
    return false
  }

  return true
}

const verifyKeys = (partitionKey: string, rowKey: string) => {
  if (!Number.isFinite(+partitionKey)) {
    throw new Error('Wrong partitionKey format')
  }
  if (rowKey.includes('.pdf') || rowKey.includes('.json')) {
    throw new Error('Wrong rowKey format. Must not have extension')
  }
}

export { settings, isLargeSize, isPDFfle, verifyKeys }
