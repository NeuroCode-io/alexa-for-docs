import * as azure from '@pulumi/azure'
import { reportError } from './lib/slack'
import { keysFromFileName } from './lib/utils'
import { StateStore } from './state'
import { saveDocuments } from './azure/searchService'
import { ProcessedJson } from './types'
import { cleanText } from './lib/utils'
import * as verify from './verify'

const clean = (data: ProcessedJson[]) => data.map((d) => ({ ...d, content: cleanText(d.content) }))

const onJsonUpload = async (ctx: azure.storage.BlobContext, arg: Buffer) => {
  let state = undefined

  try {
    const { fileName, partitionKey, rowKey } = keysFromFileName(ctx.bindingData.blobTrigger)
    verify.verifyKeys(partitionKey, rowKey)
    
    state = new StateStore(partitionKey, rowKey)
    ctx.log.info(`Processing ${fileName}`)

    await state.jsonFileUploaded()

    let data = null
    try {
      const { result } = JSON.parse(arg.toString())
      data = result as ProcessedJson[]
    } catch (err) {
      ctx.log.warn('Corrupt file')
    }

    if (!Array.isArray(data)) throw new Error('Parsing error. Received corrupted JSON')

    await saveDocuments(clean(data))
    await state.finished()

    ctx.log.info(`Processing ${fileName} done`)
  } catch (error) {
    await Promise.all([reportError(error), state?.internalError()])
  }
}

export { onJsonUpload }
