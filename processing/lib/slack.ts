import config from '../../config'
import * as azure from '@pulumi/azure'
import axios from 'axios'

const getStack = (stack?: string) => `\`\`\`
  ${JSON.stringify(stack, null, 2)}
\`\`\`
`

const reportError = (error: Error, ctx?: azure.storage.BlobContext) => {
  const logger = ctx?.log.error ?? console.error
  const webHook = process.env.SLACK_WEBHOOK

  if (!webHook) throw new Error('Slack webhook app setting missing')

  logger(`Error occured in ${config.appName}`)

  const stack = getStack(error.stack)

  const dateTimeStr = new Date().toISOString()

  const message = `${dateTimeStr} - an error occured in ${config.appName}

  ${stack}
  `

  return axios({ method: 'POST', url: webHook, data: { text: message } })
}

export { reportError }
