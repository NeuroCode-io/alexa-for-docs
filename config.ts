import * as pulmui from '@pulumi/pulumi'

const config = new pulmui.Config()

const location = {
  northeurope: 'ne',
  westeurope: 'we',
  francecentral: 'fc',
}

const env = pulmui.getStack()

//@ts-ignore
const shortLocation = location[config.require('deployLocation')]
if (!shortLocation) throw new Error('ConfigError: Unknown location provided')

const rgName = `${shortLocation}-${env}-${config.require('appName')}`
const prefix = `${shortLocation}-${env}`
const searchServiceIndex = 'neurocode-uploads'
const tableName = 'statestore'

export default {
  appName: config.require('appName'),
  prefix,
  resourceGroupName: rgName,
  location: config.require('deployLocation'),
  searchSku: config.require('searchServiceSku'),
  slackHook: config.requireSecret('slackWebHook'),
  searchServiceIndex,
  tableName,
}
