export = ContentBasedRecommender
declare class ContentBasedRecommender {
  constructor(options?: {})
  data: {}
  setOptions(options?: {}): void
  options: any
  train(documents: any): void
  trainBidirectional(documents: any, targetDocuments: any): void
  validateDocuments(documents: any): void
  getSimilarDocuments(id: any, start?: number, size?: any): any
  export(): {
    options: any
    data: {}
  }
  import(object: any): void
  _preprocessDocuments(documents: any, options: any): any
  _getTokensFromString(string: any): any[]
  _produceWordVectors(
    processedDocuments: any,
    options: any
  ): {
    id: any
    vector: any
  }[]
  _calculateSimilaritiesBetweenTwoVectors(
    documentVectors: any,
    targetDocumentVectors: any,
    options: any
  ): any
  initializeDataHash(documentVectors: any): any
  _calculateSimilarities(documentVectors: any, options: any): any
  orderDocuments(data: any, options: any): void
}
