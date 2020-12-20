import * as azure from '@pulumi/azure'
import { processingRg } from './resourceGroup'
import config from '../config'

const accountName = config.resourceGroupName.replace(/-/g, '')

const storageAccount = new azure.storage.Account(accountName, {
  name: accountName,
  resourceGroupName: processingRg.name,
  accountReplicationType: 'LRS',
  accountTier: 'Standard',
})

const storageContainer = new azure.storage.Container('pdf-upload', {
  name: 'pdf-upload',
  storageAccountName: storageAccount.name,
})

const stateStore = new azure.storage.Table('statestore', {
  name: 'statestore',
  storageAccountName: storageAccount.name,
})

const processedContainer = new azure.storage.Container('pdf-processed', {
  name: 'pdf-processed',
  storageAccountName: storageAccount.name,
})

export { storageContainer, processedContainer, storageAccount }
