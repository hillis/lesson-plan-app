declare module 'docx-pdf-converter' {
  interface ConversionOptions {
    returnType?: 'buffer' | 'file' | 'base64'
    outputDir?: string
  }

  interface ConversionResult {
    buffer: Buffer
    filename: string
  }

  interface Base64Result {
    base64: string
    filename: string
  }

  interface FileResult {
    filename: string
  }

  export function convertDocxToPdf(
    docxBuffer: Buffer,
    filename: string,
    options?: ConversionOptions
  ): Promise<ConversionResult>

  export function extractDocumentMetadata(docxBuffer: Buffer): Promise<unknown>
}
