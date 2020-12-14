import * as azure from '@pulumi/azure'
import { resourceGroup } from './resourceGroup'
import config from '../config'

const accountName = config.appName.replace(/-/g, '')

const storageAccount = new azure.storage.Account(accountName, {
  resourceGroupName: resourceGroup.name,
  accountReplicationType: 'LRS',
  accountTier: 'Standard',
})

const storageContainer = new azure.storage.Container('pdf-upload', {
  storageAccountName: storageAccount.name,
})

const processedContainer = new azure.storage.Container('pdf-processed', {
  storageAccountName: storageAccount.name,
})

export { storageContainer, processedContainer, storageAccount }
