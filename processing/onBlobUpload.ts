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
  let st = undefined

  try {
    const { fileName, partitionKey, rowKey } = keysFromFileName(ctx.bindingData.blobTrigger)
    st = new StateStore(partitionKey, rowKey)
    if (verify.isLargeSize(arg)) {
      return await st.fileTooLarge()
    }

    if (!verify.isPDFfle(arg)) {
      return await st.notPDFtype()
    }

    await st.pdfFileUploaded()

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

    const uploadFileName = `${rowKey}.json`
    const content = Buffer.from(JSON.stringify({ result }))

    await uploadJsonFile(uploadFileName, content)
    await st.knowledgeSourceProcessed()

    ctx.log.info(`Processing ${fileName} done`)
  } catch (error) {
    await Promise.all([reportError(error), st?.internalError()])
  }
}

export { onPDFupload }
