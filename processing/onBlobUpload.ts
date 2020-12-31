import * as azure from '@pulumi/azure'
import { getText } from './pdf'
import { getRandomString } from './lib/generateId'
import { reportError } from './lib/slack'
import { keysFromFileName } from './lib/utils'
import { ProcessedJson } from './types'
import { uploadJsonFile } from './azure/blob'
import { StateStore } from './state'
import * as verify from './verify'

const onPDFupload = async (ctx: azure.storage.BlobContext, arg: Buffer) => {
  let state = undefined

  try {
    const { partitionKey, rowKey, fileName } = keysFromFileName(ctx.bindingData.blobTrigger)
    verify.verifyKeys(partitionKey)

    state = new StateStore(partitionKey, rowKey)

    if (verify.isLargeSize(arg)) {
      return await state.fileTooLarge()
    }

    if (!verify.isPDFfle(arg)) {
      return await state.notPDFtype()
    }

    await state.pdfFileUploaded()

    ctx.log.info(`Processing ${fileName}`)

    let result: ProcessedJson[] = []
    for await (const obj of getText(arg)) {
      result.push({
        id: getRandomString(),
        page: obj.page,
        content: obj.content,
        fileName,
      })
    }

    const content = Buffer.from(JSON.stringify({ result }))

    await uploadJsonFile(fileName, content)
    await state.knowledgeSourceProcessed()

    ctx.log.info(`Processing ${fileName} done`)
  } catch (error) {
    await Promise.all([reportError(error), state?.internalError()])
  }
}

export { onPDFupload }
