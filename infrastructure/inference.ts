import * as azure from '@pulumi/azure'
import * as pulumi from '@pulumi/pulumi'
import { resourceGroup } from './resourceGroup'

const linuxPlan = new azure.appservice.Plan('linux-asp', {
  resourceGroupName: resourceGroup.name,
  kind: 'Linux',
  sku: { tier: 'Dynamic', size: 'Y1' },
  reserved: true,
})

const pythonApp = new azure.appservice.ArchiveFunctionApp('http-python', {
  resourceGroup: resourceGroup,
  plan: linuxPlan,
  archive: new pulumi.asset.FileArchive('./python'),
  appSettings: {
    runtime: 'python',
  },
})

export { pythonApp }
