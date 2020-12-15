import * as azure from '@pulumi/azure'
import { processingRg } from './resourceGroup'
import { SearchIndexClient, AzureKeyCredential } from '@azure/search-documents'
import config from '../config'

const handleError = (err: Error) => {
  if (err?.message?.includes('already exists')) return

  throw err
}

const createIndex = async (endpoint: string, apiKey: string) => {
  const client = new SearchIndexClient(endpoint, new AzureKeyCredential(apiKey))

  await client
    .createOrUpdateIndex({
      name: 'neurocode-uploads',
      fields: [
        {
          type: 'Edm.String',
          name: 'id',
          key: true,
        },
        {
          type: 'Edm.String',
          name: 'content',
          searchable: true,
          analyzerName: 'en.lucene',
        },
        {
          type: 'Edm.Int32',
          name: 'page',
          searchable: false,
          filterable: true,
        },
        {
          type: 'Edm.String',
          name: 'fileName',
          searchable: true,
          sortable: true,
          filterable: true,
        },
      ],
    })
    .catch(handleError)
}

const search = new azure.search.Service(`${config.prefix}-search`, {
  name: `${config.prefix}-search`,
  resourceGroupName: processingRg.name,
  sku: config.searchSku,
})

search.secondaryKey.apply((apiKey) => {
  search.name.apply((name) => {
    return createIndex(`https://${name}.search.windows.net`, apiKey)
  })
})

export { search }
