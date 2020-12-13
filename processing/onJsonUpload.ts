import * as azure from '@pulumi/azure'
import { SearchClient, AzureKeyCredential } from '@azure/search-documents'
import { reportError } from './lib/slack'
import { chunk } from './lib/array'

const onJsonUpload = async (ctx: azure.storage.BlobContext, arg: Buffer) => {
  try {
    const apiKey = process.env.SEARCH_SERIVCE_KEY
    const searchServiceName = process.env.SEARCH_SERVICE_NAME

    if (!apiKey || !searchServiceName) throw new Error('App Settings missing')

    ctx.log.info(`Processing ${ctx.bindingData.blobTrigger}`)

    const client = new SearchClient(
      `https://${searchServiceName}.search.windows.net`,
      'neurocode-uploads',
      new AzureKeyCredential(apiKey)
    )

    //@ts-ignore
    const { result } = JSON.parse(arg)

    if (!Array.isArray(result)) throw new Error('Parsing error. Received corrupted JSON')

    const chunks = chunk(result, 500)
    for (const c of chunks) {
      await client.uploadDocuments(c)
    }

    ctx.log.info(`Processing ${ctx.bindingData.blobTrigger} done`)
  } catch (error) {
    await reportError(error)
  }
}

export { onJsonUpload }
