import * as azure from '@pulumi/azure'
import config from '../config'

const processingRg = new azure.core.ResourceGroup(config.resourceGroupName, {
  location: config.location,
})

const questionAnsweringRg = new azure.core.ResourceGroup(`${config.resourceGroupName}-qna`, {
  location: config.location,
})

export { processingRg, questionAnsweringRg }
