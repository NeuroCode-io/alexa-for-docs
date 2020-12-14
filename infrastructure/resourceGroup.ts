import * as azure from '@pulumi/azure'
import config from '../config'

const resourceGroup = new azure.core.ResourceGroup(config.resourceGroupName, {
  location: config.location,
})

export { resourceGroup }
