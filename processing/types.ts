type ProcessedJson = {
  id: string
  page: number
  content: string
  fileName: string
}

type ProcessingState =
  | 'pdf-knowledge-source-requested'
  | 'pdf-knowledge-source-uploaded'
  | 'pdf-knowledge-source-processed'
  | 'json-file-uploaded'
  | 'json-file-processed'

export { ProcessedJson, ProcessingState }
