import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import {
  KnowledgeDocument,
  DocumentChunk,
  DocumentMetadata,
  ChunkMetadata,
  DocumentType,
  RAGConfig
} from '@/types/rag';

export class DocumentProcessor {
  private chunkingConfig: RAGConfig['chunking'];

  constructor(chunkingConfig: RAGConfig['chunking']) {
    this.chunkingConfig = chunkingConfig;
  }

  /**
   * Process a document and extract text content
   */
  async processDocument(
    file: Buffer,
    fileName: string,
    fileType: DocumentType
  ): Promise<{ content: string; metadata: DocumentMetadata }> {
    try {
      let content: string;
      let metadata: Partial<DocumentMetadata> = {
        fileName,
        fileType,
        fileSize: file.length
      };

      switch (fileType) {
        case DocumentType.PDF:
          const pdfResult = await this.processPDF(file);
          content = pdfResult.content;
          metadata = { ...metadata, ...pdfResult.metadata };
          break;

        case DocumentType.DOCX:
          const docxResult = await this.processDOCX(file);
          content = docxResult.content;
          metadata = { ...metadata, ...docxResult.metadata };
          break;

        case DocumentType.TXT:
          content = file.toString('utf-8');
          break;

        case DocumentType.HTML:
          content = this.processHTML(file.toString('utf-8'));
          break;

        case DocumentType.MD:
          content = this.processMarkdown(file.toString('utf-8'));
          break;

        case DocumentType.JSON:
          content = this.processJSON(file.toString('utf-8'));
          break;

        case DocumentType.CSV:
          content = this.processCSV(file.toString('utf-8'));
          break;

        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      // Extract additional metadata
      const enhancedMetadata = this.extractMetadata(content, metadata);

      return {
        content: this.cleanText(content),
        metadata: enhancedMetadata as DocumentMetadata
      };
    } catch (error) {
      console.error('Error processing document:', error);
      throw new Error(`Failed to process document: ${error}`);
    }
  }

  /**
   * Process PDF files
   */
  private async processPDF(buffer: Buffer): Promise<{ content: string; metadata: Partial<DocumentMetadata> }> {
    try {
      const data = await pdfParse(buffer);
      
      return {
        content: data.text,
        metadata: {
          author: data.info?.Author,
          createdDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
          modifiedDate: data.info?.ModDate ? new Date(data.info.ModDate) : undefined
        }
      };
    } catch (error) {
      throw new Error(`Failed to process PDF: ${error}`);
    }
  }

  /**
   * Process DOCX files
   */
  private async processDOCX(buffer: Buffer): Promise<{ content: string; metadata: Partial<DocumentMetadata> }> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      
      return {
        content: result.value,
        metadata: {}
      };
    } catch (error) {
      throw new Error(`Failed to process DOCX: ${error}`);
    }
  }

  /**
   * Process HTML content
   */
  private processHTML(html: string): string {
    const $ = cheerio.load(html);
    
    // Remove script and style elements
    $('script, style').remove();
    
    // Extract text content
    return $.text();
  }

  /**
   * Process Markdown content
   */
  private processMarkdown(markdown: string): string {
    // Simple markdown processing - remove markdown syntax
    return markdown
      .replace(/^#{1,6}\s+/gm, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1'); // Remove images
  }

  /**
   * Process JSON content
   */
  private processJSON(json: string): string {
    try {
      const parsed = JSON.parse(json);
      return this.extractTextFromObject(parsed);
    } catch (error) {
      return json; // Return as-is if parsing fails
    }
  }

  /**
   * Process CSV content
   */
  private processCSV(csv: string): string {
    const lines = csv.split('\n');
    const headers = lines[0]?.split(',') || [];
    
    return lines.slice(1)
      .map(line => {
        const values = line.split(',');
        return headers.map((header, index) => `${header}: ${values[index] || ''}`).join(', ');
      })
      .join('\n');
  }

  /**
   * Extract text from nested objects
   */
  private extractTextFromObject(obj: any, depth: number = 0): string {
    if (depth > 10) return ''; // Prevent infinite recursion
    
    if (typeof obj === 'string') {
      return obj;
    }
    
    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return String(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.extractTextFromObject(item, depth + 1)).join(' ');
    }
    
    if (typeof obj === 'object' && obj !== null) {
      return Object.entries(obj)
        .map(([key, value]) => `${key}: ${this.extractTextFromObject(value, depth + 1)}`)
        .join(' ');
    }
    
    return '';
  }

  /**
   * Clean and normalize text
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
  }

  /**
   * Extract metadata from content
   */
  private extractMetadata(content: string, existingMetadata: Partial<DocumentMetadata>): DocumentMetadata {
    const wordCount = content.split(/\s+/).length;
    const language = this.detectLanguage(content);
    const keywords = this.extractKeywords(content);
    const summary = this.generateSummary(content);

    return {
      fileName: existingMetadata.fileName || '',
      fileType: existingMetadata.fileType || '',
      fileSize: existingMetadata.fileSize || 0,
      author: existingMetadata.author,
      createdDate: existingMetadata.createdDate,
      modifiedDate: existingMetadata.modifiedDate,
      language,
      keywords,
      summary
    };
  }

  /**
   * Simple language detection
   */
  private detectLanguage(text: string): string {
    // Simple heuristic - could be enhanced with proper language detection library
    const sample = text.substring(0, 1000).toLowerCase();
    
    if (/\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/.test(sample)) {
      return 'en';
    }
    
    return 'unknown';
  }

  /**
   * Extract keywords from content
   */
  private extractKeywords(content: string, maxKeywords: number = 10): string[] {
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    return Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  /**
   * Generate a simple summary
   */
  private generateSummary(content: string, maxLength: number = 200): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length === 0) return '';
    
    let summary = sentences[0].trim();
    
    for (let i = 1; i < sentences.length && summary.length < maxLength; i++) {
      const nextSentence = sentences[i].trim();
      if (summary.length + nextSentence.length + 1 <= maxLength) {
        summary += '. ' + nextSentence;
      } else {
        break;
      }
    }
    
    return summary + (summary.endsWith('.') ? '' : '.');
  }

  /**
   * Chunk document content into smaller pieces
   */
  chunkDocument(
    documentId: string,
    content: string,
    metadata: DocumentMetadata
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const maxChunkSize = this.chunkingConfig.maxChunkSize;
    const overlap = this.chunkingConfig.chunkOverlap;

    if (this.chunkingConfig.preserveStructure) {
      return this.chunkByStructure(documentId, content, metadata);
    }

    let startPosition = 0;
    let chunkIndex = 0;

    while (startPosition < content.length) {
      const endPosition = Math.min(startPosition + maxChunkSize, content.length);
      let chunkContent = content.substring(startPosition, endPosition);

      // Try to break at sentence boundaries
      if (endPosition < content.length) {
        const lastSentenceEnd = chunkContent.lastIndexOf('.');
        const lastNewline = chunkContent.lastIndexOf('\n');
        const breakPoint = Math.max(lastSentenceEnd, lastNewline);

        if (breakPoint > startPosition + maxChunkSize * 0.5) {
          chunkContent = content.substring(startPosition, startPosition + breakPoint + 1);
        }
      }

      const chunk: DocumentChunk = {
        id: `${documentId}_chunk_${chunkIndex}`,
        documentId,
        content: chunkContent.trim(),
        embeddings: [], // Will be populated later
        chunkIndex,
        startPosition,
        endPosition: startPosition + chunkContent.length,
        metadata: {
          wordCount: chunkContent.split(/\s+/).length,
          characterCount: chunkContent.length
        }
      };

      chunks.push(chunk);

      // Move to next chunk with overlap
      startPosition += chunkContent.length - overlap;
      chunkIndex++;
    }

    return chunks;
  }

  /**
   * Chunk document by structure (paragraphs, sections)
   */
  private chunkByStructure(
    documentId: string,
    content: string,
    metadata: DocumentMetadata
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const paragraphs = content.split(/\n\s*\n/);
    let chunkIndex = 0;
    let currentPosition = 0;

    for (const paragraph of paragraphs) {
      if (paragraph.trim().length === 0) continue;

      const chunk: DocumentChunk = {
        id: `${documentId}_chunk_${chunkIndex}`,
        documentId,
        content: paragraph.trim(),
        embeddings: [],
        chunkIndex,
        startPosition: currentPosition,
        endPosition: currentPosition + paragraph.length,
        metadata: {
          wordCount: paragraph.split(/\s+/).length,
          characterCount: paragraph.length
        }
      };

      chunks.push(chunk);
      currentPosition += paragraph.length + 2; // +2 for the paragraph separator
      chunkIndex++;
    }

    return chunks;
  }

  /**
   * Determine document type from file extension
   */
  static getDocumentType(fileName: string): DocumentType {
    const extension = fileName.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'pdf':
        return DocumentType.PDF;
      case 'docx':
        return DocumentType.DOCX;
      case 'txt':
        return DocumentType.TXT;
      case 'html':
      case 'htm':
        return DocumentType.HTML;
      case 'md':
      case 'markdown':
        return DocumentType.MD;
      case 'json':
        return DocumentType.JSON;
      case 'csv':
        return DocumentType.CSV;
      default:
        throw new Error(`Unsupported file type: ${extension}`);
    }
  }
}