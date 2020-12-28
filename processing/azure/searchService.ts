import { SearchClient, AzureKeyCredential } from '@azure/search-documents'
import { chunk } from '../lib/array'
import * as verify from '../verify'
import { ProcessedJson } from '../types'

const saveDocuments = async (data: ProcessedJson[]) => {
  const opts = verify.settings()

  const client = new SearchClient(
    `https://${opts.searchServiceName}.search.windows.net`,
    opts.searchIndex,
    new AzureKeyCredential(opts.searchApiKey)
  )

  const chunkedDocs = chunk(data, 500)

  for (const c of chunkedDocs) {
    await client.uploadDocuments(c)
  }
}

export { saveDocuments }
