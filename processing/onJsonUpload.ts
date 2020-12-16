import * as azure from '@pulumi/azure'
import { SearchClient, AzureKeyCredential } from '@azure/search-documents'
import { reportError } from './lib/slack'
import { chunk } from './lib/array'
import { ProcessedJson } from './types'

const clean = (data: ProcessedJson[]) => data.map((d) => ({...d, content: d.content.replace(/\t/g, ' ')}))

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

    let data = null
    try {
      //@ts-ignore
      const { result } = JSON.parse(arg)
      data = result as ProcessedJson[]
    } catch (err) {
      //will be dealt with on line 34
      ctx.log.warn('Corrupt file')
    }

    if (!Array.isArray(data)) throw new Error('Parsing error. Received corrupted JSON')

    const chunkedDocs = chunk(clean(data), 500)

    for (const c of chunkedDocs) {
      await client.uploadDocuments(c)
    }

    ctx.log.info(`Processing ${ctx.bindingData.blobTrigger} done`)
  } catch (error) {
    await reportError(error)
  }
}

export { onJsonUpload }
