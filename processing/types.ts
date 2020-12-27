type ProcessedJson = {
  id: string
  page: number
  content: string
  fileName: string
}

type ProcessingError = 'internal-error'

type PDFProcessingState =
  | 'pdf-knowledge-source-requested'
  | 'pdf-knowledge-source-too-large'
  | 'pdf-knowledge-source-incompatible-type'
  | 'pdf-knowledge-source-uploaded'
  | 'pdf-knowledge-source-processed'

type JSONProcessingState = 'json-file-uploaded' | 'json-file-processed'

type ProcessingState = PDFProcessingState | JSONProcessingState | ProcessingError

export { ProcessedJson, ProcessingState }
