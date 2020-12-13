//@ts-ignore
import * as PDFJS from 'pdfjs-dist/es5/build/pdf'
// import * as PDFJS from 'pdfjs-dist'

async function* getText(data: Buffer) {
  const pdf = await PDFJS.getDocument({ data }).promise

  const maxPages = pdf.numPages

  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i)
    const text = await page.getTextContent()

    yield { page: i, content: text.items.map((item: any) => item.str).join('') }
  }
}

export { getText }
