import * as azure from '@pulumi/azure'
import * as pulumi from '@pulumi/pulumi'
import config from '../config'
import { questionAnsweringRg } from './resourceGroup'

const name = `${config.resourceGroupName}-qna`

const linuxPlan = new azure.appservice.Plan(name, {
  name,
  resourceGroupName: questionAnsweringRg.name,
  kind: 'Linux',
  sku: { tier: 'Dynamic', size: 'Y1' },
  reserved: true,
})

const pythonApp = new azure.appservice.ArchiveFunctionApp(name, {
  name,
  resourceGroup: questionAnsweringRg,
  plan: linuxPlan,
  archive: new pulumi.asset.FileArchive('./python/question_answering'),
  appSettings: {
    runtime: 'python',
  },
})

export { pythonApp }
