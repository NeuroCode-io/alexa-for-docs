import * as azure from '@pulumi/azure'
import { storageContainer, processedContainer, storageAccount } from './infrastructure/storage'
import { onPDFupload } from './processing/onBlobUpload'
import { onJsonUpload } from './processing/onJsonUpload'
import { search } from './infrastructure/searchService'
import config from './config'
import { resourceGroup } from './infrastructure/resourceGroup'
import { pythonApp } from './infrastructure/inference'

const pdfUpload = storageContainer.getEventFunction('pdf-upload', {
  callback: onPDFupload,
  filterSuffix: '.pdf',
})

const jsonProcessing = processedContainer.getEventFunction('json-process', {
  callback: onJsonUpload,
  filterSuffix: '.json',
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
  },
  resourceGroupName: resourceGroup.name,
  functions: [pdfUpload, jsonProcessing],
})

export const httpEndpoint = serverlessApp.endpoint.apply((endpoint) => `${endpoint}`)
export const inferenceEndpoint = pythonApp.endpoint.apply((endpoint) => `${endpoint}`)
