declare class ContentBasedRecommender {
  /**
   * @param {Options} [options={}] - default {}
   */
  constructor(options?: Options)
  /**
   * @type {Data}
   * @public
   */
  public data: Data
  /**
   * @param {Options} [options={}]
   * @throws an error if the maxVectorSize is not an integer or if it is lower than 0, or if maxSimilarDocs is not an integer or if it is lower than 0, or if minScore is not between 0 and 1
   */
  setOptions(options?: Options): void
  /**
   * @type {Options}
   * @public
   */
  public options: Options
  /**
   * @param {Document[]} documents
   */
  train(documents: Document[]): void
  /**
   * @param {Document[]} documents
   * @param {Document[]} targetDocuments
   */
  trainBidirectional(documents: Document[], targetDocuments: Document[]): void
  /**
   * @param {Document[]} documents
   * @throws an error if the param is not an array or if properties from the elements of the array are missing or are wrong
   */
  validateDocuments(documents: Document[]): void
  /**
   * @param {string} id - document id
   * @param {number} [start=0] - default 0
   * @param {number} [size=undefined] - default undefined
   * @return {DocumentVector[]}
   */
  getSimilarDocuments(
    id: string,
    start?: number,
    size?: number
  ): DocumentVector[]
  /**
   * @return {Export}
   */
  export(): Export
  /**
   * @param {Export} object
   */
  import(object: Export): void
  /**
   * @param {Document[]} documents
   * @param {Options[]} [options]
   * @returns {ProcessedDocument[]}
   */
  _processDocuments(
    documents: Document[],
    options?: Options[]
  ): ProcessedDocument[]
  /**
   * @param {string} content - Content from a document
   * @returns {string[]} - Tokens from the content of a document (keywords)
   */
  _getTokensFromString(content: string): string[]
  /**
   * @param {ProcessedDocument[]} processedDocuments - Processed documents
   * @param {Options} options
   * @returns {DocumentVector[]} - Document id with its vector
   */
  _produceWordVectors(
    processedDocuments: ProcessedDocument[],
    options: Options
  ): DocumentVector[]
  /**
   * @param {DocumentVector[]} documentVectors
   * @param {DocumentVector[]} targetDocumentVectors
   * @param {Options} options
   * @returns {Data}
   */
  _calculateSimilaritiesBetweenTwoVectors(
    documentVectors: DocumentVector[],
    targetDocumentVectors: DocumentVector[],
    options: Options
  ): Data
  /**
   * @param {DocumentVector[]} documentVectors
   * @returns {Data} - object which keys are every document id and its value is an empty array
   */
  initializeDataHash(documentVectors: DocumentVector[]): Data
  /**
   * @param {DocumentVector[]} documentVectors
   * @param {Options} options
   * @returns {Data}
   */
  _calculateSimilarities(
    documentVectors: DocumentVector[],
    options: Options
  ): Data
  /**
   * @param {DocumentVector[]} data
   * @param {Options} options
   */
  orderDocuments(data: DocumentVector[], options: Options): void
}
declare namespace ContentBasedRecommender {
  export { ProcessedDocument, Options, Document, DocumentVector, Data, Export }
}
type Data = {
  [x: string]: DocumentVector
}
/**
 * - Options to create a ContentBasedRecommender
 */
type Options = {
  /**
   * - Max vector size to control the max size of word vector after tf-idf processing. A smaller vector size will help training performance while not affecting recommendation quality. Defaults to be 100
   */
  maxVectorSize: number
  /**
   * - The minimum score required to meet to consider it is a similar document. It will save more memory by filtering out documents having low scores. Allowed values range from 0 to 1. Default is 0
   */
  minScore: number
  /**
   * - The maximum number of similar documents to keep for each document. Default is the max safe integer in javascript
   */
  maxSimilarDocs: number
  /**
   * - Show progress messages so can monitor the training progress
   */
  debug: boolean
}
type Document = {
  id: string
  content: string
}
type DocumentVector = {
  id: string
  vector: any
}
type Export = {
  data: Data
  options: Options
}
type ProcessedDocument = {
  /**
   * - document id
   */
  id: string
  /**
   * - tokens from the content of the document (keywords)
   */
  tokens: string[]
}

export = ContentBasedRecommender
