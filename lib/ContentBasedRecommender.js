const _ = require('underscore')
const Vector = require('vector-object')
const striptags = require('striptags')
const sw = require('stopword')
const natural = require('natural')

const { TfIdf, PorterStemmer, NGrams } = natural
const tokenizer = new natural.WordTokenizer()

const defaultOptions = {
  maxVectorSize : 100,
  maxSimilarDocs: Number.MAX_SAFE_INTEGER,
  minScore      : 0,
  debug         : false
}

class ContentBasedRecommender {
  /**
   * @param {Options} [options={}] - default {}
   */
  constructor(options = {}) {
    this.setOptions(options)

    /**
     * @type {Data}
     * @public
     */
    this.data = {}
  }

  /**
   * @param {Options} [options={}]
   * @throws an error if the maxVectorSize is not an integer or if it is lower than 0, or if maxSimilarDocs is not an integer or if it is lower than 0, or if minScore is not between 0 and 1
   */
  setOptions(options = {}) {
    // validation
    if (
      options.maxVectorSize !== undefined &&
      (!Number.isInteger(options.maxVectorSize) || options.maxVectorSize <= 0)
    )
      throw new Error(
        'The option maxVectorSize should be integer and greater than 0'
      )

    if (
      options.maxSimilarDocs !== undefined &&
      (!Number.isInteger(options.maxSimilarDocs) || options.maxSimilarDocs <= 0)
    )
      throw new Error(
        'The option maxSimilarDocs should be integer and greater than 0'
      )

    if (
      options.minScore !== undefined &&
      (!_.isNumber(options.minScore) ||
        options.minScore < 0 ||
        options.minScore > 1)
    )
      throw new Error('The option minScore should be a number between 0 and 1')

    /**
     * @type {Options}
     * @public
     */
    this.options = { ...defaultOptions, ...options }
  }

  /**
   * @param {Document[]} documents
   */
  train(documents) {
    this.validateDocuments(documents)

    if (this.options.debug) console.log(`Total documents: ${documents.length}`)

    // step 1 - process the documents
    const processedDocs = this._processDocuments(documents, this.options)

    // step 2 - create document vectors
    const docVectors = this._produceWordVectors(processedDocs, this.options)

    // step 3 - calculate similarities
    this.data = this._calculateSimilarities(docVectors, this.options)
  }

  /**
   * @param {Document[]} documents
   * @param {Document[]} targetDocuments
   */
  trainBidirectional(documents, targetDocuments) {
    this.validateDocuments(documents)
    this.validateDocuments(targetDocuments)

    if (this.options.debug) console.log(`Total documents: ${documents.length}`)

    // step 1 - process the documents
    const processedDocs = this._processDocuments(documents, this.options)
    const preprocessTargetDocs = this._processDocuments(
      targetDocuments,
      this.options
    )

    // step 2 - create document vectors
    const docVectors = this._produceWordVectors(processedDocs, this.options)
    const targetDocVectors = this._produceWordVectors(
      preprocessTargetDocs,
      this.options
    )

    // step 3 - calculate similarities
    this.data = this._calculateSimilaritiesBetweenTwoVectors(
      docVectors,
      targetDocVectors,
      this.options
    )
  }

  /**
   * @param {Document[]} documents
   * @throws an error if the param is not an array or if properties from the elements of the array are missing or are wrong
   */
  validateDocuments(documents) {
    if (!_.isArray(documents))
      throw new Error('Documents should be an array of objects')

    for (let i = 0; i < documents.length; i++) {
      const document = documents[i]

      if (!_.has(document, 'id') || !_.has(document, 'content'))
        throw new Error('Documents should be have fields id and content')

      if (_.has(document, 'tokens') || _.has(document, 'vector'))
        throw new Error(
          '"tokens" and "vector" properties are reserved and cannot be used as document properties"'
        )
    }
  }

  /**
   * @param {string} id - document id
   * @param {number} [start=0] - default 0
   * @param {number} [size=undefined] - default undefined
   * @return {DocumentScore[]}
   */
  getSimilarDocuments(id, start = 0, size = undefined) {
    let similarDocuments = this.data[id]

    if (similarDocuments === undefined) return []

    const end = size !== undefined ? start + size : undefined
    similarDocuments = similarDocuments.slice(start, end)

    return similarDocuments
  }

  /**
   * @return {Export}
   */
  export() {
    return {
      options: this.options,
      data   : this.data
    }
  }

  /**
   * @param {Export} object
   */
  import(object) {
    const { options, data } = object

    this.setOptions(options)
    this.data = data
  }

  /**
   * @param {Document[]} documents
   * @param {Options[]} [options]
   * @returns {ProcessedDocument[]}
   */
  _processDocuments(documents, options) {
    if (options.debug) console.log('Preprocessing documents')

    const processedDocuments = documents.map(item => {
      const tokens = this._getTokensFromString(item.content)

      return {
        id: item.id,
        tokens
      }
    })

    return processedDocuments
  }

  /**
   * @param {string} content - Content from a document
   * @returns {string[]} - Tokens from the content of a document (keywords)
   */
  _getTokensFromString(content) {
    // remove html and to lower case
    const tmpString = striptags(content, [], ' ').toLowerCase()

    // tokenize the content
    const tokens = tokenizer.tokenize(tmpString)

    // get unigrams
    const unigrams = sw
      .removeStopwords(tokens)
      .map(unigram => PorterStemmer.stem(unigram))

    // get bigrams
    const bigrams = NGrams.bigrams(tokens)
      .filter(
        bigram =>
          // filter terms with stopword
          bigram.length === sw.removeStopwords(bigram).length
      )
      .map(bigram =>
        // stem the tokens
        bigram.map(token => PorterStemmer.stem(token)).join('_')
      )

    // get trigrams
    const trigrams = NGrams.trigrams(tokens)
      .filter(
        trigram =>
          // filter terms with stopword
          trigram.length === sw.removeStopwords(trigram).length
      )
      .map(trigram =>
        // stem the tokens
        trigram.map(token => PorterStemmer.stem(token)).join('_')
      )

    return [].concat(unigrams, bigrams, trigrams)
  }

  /**
   * @param {ProcessedDocument[]} processedDocuments - Processed documents
   * @param {Options} options
   * @returns {DocumentVector[]} - Document id with its vector
   */
  _produceWordVectors(processedDocuments, options) {
    // process tfidf
    const tfidf = new TfIdf()

    processedDocuments.forEach(processedDocument => {
      tfidf.addDocument(processedDocument.tokens)
    })

    // create word vector
    const documentVectors = processedDocuments.map((document, index) => {
      if (options.debug)
        console.log(`Creating word vector for document ${index}`)

      const hash = {}
      const items = tfidf.listTerms(index)
      const maxSize = Math.min(options.maxVectorSize, items.length)

      for (let i = 0; i < maxSize; i++) {
        const item = items[i]
        hash[item.term] = item.tfidf
      }

      return {
        id    : document.id,
        vector: new Vector(hash)
      }
    })

    return documentVectors
  }

  /**
   * @param {DocumentVector[]} documentVectors
   * @param {DocumentVector[]} targetDocumentVectors
   * @param {Options} options
   * @returns {Data}
   */
  _calculateSimilaritiesBetweenTwoVectors(
    documentVectors,
    targetDocumentVectors,
    options
  ) {
    const data = {
      ...this.initializeDataHash(documentVectors),
      ...this.initializeDataHash(targetDocumentVectors)
    }

    // calculate the similar scores
    for (let i = 0; i < documentVectors.length; i++) {
      if (options.debug)
        console.log(`Calculating similarity score for document ${i}`)

      for (let j = 0; j < targetDocumentVectors.length; j++) {
        const documentVectorA = documentVectors[i]
        const targetDocumentVectorB = targetDocumentVectors[j]
        const idi = documentVectorA.id
        const vi = documentVectorA.vector
        const idj = targetDocumentVectorB.id
        const vj = targetDocumentVectorB.vector
        const similarity = vi.getCosineSimilarity(vj)

        if (similarity > options.minScore) {
          data[idi].push({
            id   : targetDocumentVectorB.id,
            score: similarity
          })
          data[idj].push({
            id   : documentVectorA.id,
            score: similarity
          })
        }
      }
    }

    this.orderDocuments(data, options)

    return data
  }

  /**
   * @param {DocumentVector[]} documentVectors
   * @returns {Data} - object which keys are every document id and its value is an empty array
   */
  initializeDataHash(documentVectors) {
    return documentVectors.reduce((acc, item) => {
      acc[item.id] = []

      return acc
    }, {})
  }

  /**
   * @param {DocumentVector[]} documentVectors
   * @param {Options} options
   * @returns {Data}
   */
  _calculateSimilarities(documentVectors, options) {
    const data = { ...this.initializeDataHash(documentVectors) }

    // calculate the similar scores
    for (let i = 0; i < documentVectors.length; i++) {
      if (options.debug)
        console.log(`Calculating similarity score for document ${i}`)

      for (let j = 0; j < i; j++) {
        const documentVectorA = documentVectors[i]
        const idi = documentVectorA.id
        const vi = documentVectorA.vector
        const documentVectorB = documentVectors[j]
        const idj = documentVectorB.id
        const vj = documentVectorB.vector
        const similarity = vi.getCosineSimilarity(vj)

        if (similarity > options.minScore) {
          data[idi].push({
            id   : documentVectorB.id,
            score: similarity
          })

          data[idj].push({
            id   : documentVectorA.id,
            score: similarity
          })
        }
      }
    }

    this.orderDocuments(data, options)

    return data
  }

  /**
   * @param {DocumentScore[]} data
   * @param {Options} options
   */
  orderDocuments(data, options) {
    // finally sort the similar documents by descending order
    Object.keys(data).forEach(id => {
      data[id].sort((a, b) => b.score - a.score)

      if (data[id].length > options.maxSimilarDocs)
        data[id] = data[id].slice(0, options.maxSimilarDocs)
    })
  }
}

module.exports = ContentBasedRecommender

/**
 * @typedef {Object} ProcessedDocument
 * @property {string} id - document id
 * @property {string[]} tokens - tokens from the content of the document (keywords)
 */

/**
 * @typedef {Object} Options - Options to create a ContentBasedRecommender
 * @property {number} maxVectorSize - Max vector size to control the max size of word vector after tf-idf processing. A smaller vector size will help training performance while not affecting recommendation quality. Defaults to be 100
 * @property {number} minScore - The minimum score required to meet to consider it is a similar document. It will save more memory by filtering out documents having low scores. Allowed values range from 0 to 1. Default is 0
 * @property {number} maxSimilarDocs - The maximum number of similar documents to keep for each document. Default is the max safe integer in javascript
 * @property {boolean} debug - Show progress messages so can monitor the training progress
 */

/**
 * @typedef {Object} Document
 * @property {string} id
 * @property {string} content
 */

/**
 * @typedef {Object} DocumentVector
 * @property {string} id
 * @property {Vector} vector
 */

/**
 * @typedef {Object} DocumentScore
 * @property {string} id
 * @property {number} score
 */

/**
 * @typedef {Object<string, DocumentScore>} Data
 */

/**
 * @typedef {Object} Export
 * @property {Data} data
 * @property {Options} options
 */