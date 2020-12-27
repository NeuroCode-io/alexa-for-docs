import * as fs from 'fs'
import * as azure from '@pulumi/azure'
import { storageContainer, processedContainer, storageAccount } from './infrastructure/storage'
import { onPDFupload } from './processing/onBlobUpload'
import { onJsonUpload } from './processing/onJsonUpload'
import { search } from './infrastructure/searchService'
import config from './config'
import { processingRg } from './infrastructure/resourceGroup'

const pdfUpload = storageContainer.getEventFunction('pdf-upload', {
  callback: onPDFupload,
  filterSuffix: '.pdf',
})

const jsonProcessing = processedContainer.getEventFunction('json-process', {
  callback: onJsonUpload,
  filterSuffix: '.json',
})

const buildTestEnvFile = (envs: any) =>
  config.prefix.includes('bob')
    ? null
    : `STORAGE_ACCOUNT_NAME=${envs.accountName}
STORAGE_ACCOUNT_KEY=${envs.accountKey}
STORAGE_CONTAINER_NAME=${envs.containerName}
SEARCH_SERIVCE_KEY=${envs.searchApiKey}
SEARCH_SERVICE_NAME=${envs.searchServiceName}
SEARCH_SERIVCE_INDEX=${config.searchServiceIndex}
`

storageAccount.primaryAccessKey.apply((accountKey) => {
  storageAccount.name.apply((accountName) => {
    processedContainer.name.apply((containerName) => {
      search.secondaryKey.apply((searchApiKey) => {
        search.name.apply((searchServiceName) => {
          fs.writeFileSync(
            'test.env',
            buildTestEnvFile({ accountKey, accountName, containerName, searchApiKey, searchServiceName })
          )
        })
      })
    })
  })
})

const serverlessApp = new azure.appservice.MultiCallbackFunctionApp(`${config.resourceGroupName}-app`, {
  name: `${config.resourceGroupName}-app`,
  appSettings: {
    STORAGE_ACCOUNT_KEY: storageAccount.primaryAccessKey.apply((key) => key),
    STORAGE_ACCOUNT_NAME: storageAccount.name.apply((accountName) => accountName),
    STORAGE_CONTAINER_NAME: processedContainer.name.apply((containerName) => containerName),
    SEARCH_SERIVCE_KEY: search.secondaryKey.apply((apiKey) => apiKey),
    SEARCH_SERVICE_NAME: search.name.apply((name) => name),
    SLACK_WEBHOOK: config.slackHook.apply((secret) => secret),
    SEARCH_SERIVCE_INDEX: config.searchServiceIndex,
  },
  resourceGroupName: processingRg.name,
  functions: [pdfUpload, jsonProcessing],
})

export const httpEndpoint = serverlessApp.endpoint.apply((endpoint) => `${endpoint}`)
