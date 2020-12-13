import config from '../../config'
import * as azure from '@pulumi/azure'
import * as fetch from 'isomorphic-fetch'

const getStack = (stack?: string) => `\`\`\`
  ${JSON.stringify(stack, null, 2)}
\`\`\`
`


const reportError = (error: Error, ctx?: azure.storage.BlobContext) => {
  const logger = ctx?.log.error ?? console.error
  const webHook = process.env.SLACK_WEBHOOK

  if (!webHook) throw new Error('App Settings missing')

  logger(`Error occured in ${config.appName}`)

  const stack = getStack(error.stack)

  const dateTimeStr = new Date().toISOString()

  const message = `${dateTimeStr} - an error occured in ${config.appName}

  ${stack}
  `
  
  const init = {
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
    body: JSON.stringify({ text: message }),
  }

  return fetch(webHook, init)
}

export { reportError }
