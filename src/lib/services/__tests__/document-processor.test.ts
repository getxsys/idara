import { DocumentProcessor } from '../document-processor';
import { DocumentType, RAGConfig } from '@/types/rag';

// Mock cheerio
jest.mock('cheerio', () => ({
  load: jest.fn((html) => {
    const mockCheerio = {
      text: jest.fn(() => 'Title This is a paragraph.'),
      remove: jest.fn(() => mockCheerio)
    };
    return mockCheerio;
  })
}));

// Mock pdf-parse
jest.mock('pdf-parse', () => jest.fn(() => Promise.resolve({
  text: 'PDF content',
  info: {
    Author: 'Test Author',
    CreationDate: new Date('2023-01-01'),
    ModDate: new Date('2023-01-02')
  }
})));

// Mock mammoth
jest.mock('mammoth', () => ({
  extractRawText: jest.fn(() => Promise.resolve({
    value: 'DOCX content'
  }))
}));

describe('DocumentProcessor', () => {
  let processor: DocumentProcessor;
  const mockConfig: RAGConfig['chunking'] = {
    maxChunkSize: 1000,
    chunkOverlap: 200,
    preserveStructure: true
  };

  beforeEach(() => {
    processor = new DocumentProcessor(mockConfig);
  });

  describe('processDocument', () => {
    it('should process plain text files', async () => {
      const content = 'This is a test document with some content.';
      const buffer = Buffer.from(content, 'utf-8');
      
      const result = await processor.processDocument(buffer, 'test.txt', DocumentType.TXT);
      
      expect(result.content).toBe(content);
      expect(result.metadata.fileName).toBe('test.txt');
      expect(result.metadata.fileType).toBe(DocumentType.TXT);
      expect(result.metadata.fileSize).toBe(buffer.length);
    });

    it('should process HTML files and extract text', async () => {
      const html = '<html><body><h1>Title</h1><p>This is a paragraph.</p><script>alert("test");</script></body></html>';
      const buffer = Buffer.from(html, 'utf-8');
      
      const result = await processor.processDocument(buffer, 'test.html', DocumentType.HTML);
      
      expect(result.content).toBe('Title This is a paragraph.');
      expect(result.metadata.fileName).toBe('test.html');
      expect(result.metadata.fileType).toBe(DocumentType.HTML);
    });

    it('should process Markdown files', async () => {
      const markdown = '# Title\n\nThis is **bold** text and *italic* text.';
      const buffer = Buffer.from(markdown, 'utf-8');
      
      const result = await processor.processDocument(buffer, 'test.md', DocumentType.MD);
      
      expect(result.content).toContain('Title');
      expect(result.content).toContain('bold');
      expect(result.content).toContain('italic');
      expect(result.content).not.toContain('#');
      expect(result.content).not.toContain('**');
    });

    it('should process JSON files', async () => {
      const json = JSON.stringify({
        name: 'Test Document',
        description: 'This is a test',
        items: ['item1', 'item2']
      });
      const buffer = Buffer.from(json, 'utf-8');
      
      const result = await processor.processDocument(buffer, 'test.json', DocumentType.JSON);
      
      expect(result.content).toContain('Test Document');
      expect(result.content).toContain('This is a test');
      expect(result.content).toContain('item1');
    });

    it('should handle unsupported file types', async () => {
      const buffer = Buffer.from('test content', 'utf-8');
      
      await expect(
        processor.processDocument(buffer, 'test.xyz', 'xyz' as DocumentType)
      ).rejects.toThrow('Failed to process document');
    });
  });

  describe('chunkDocument', () => {
    it('should chunk document into appropriate sizes', () => {
      const content = 'A'.repeat(2500); // 2500 characters
      const documentId = 'test-doc';
      const metadata = {
        fileName: 'test.txt',
        fileType: 'txt',
        fileSize: 2500
      } as any;

      const chunks = processor.chunkDocument(documentId, content, metadata);

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].content.length).toBeLessThanOrEqual(mockConfig.maxChunkSize);
      expect(chunks[0].documentId).toBe(documentId);
      expect(chunks[0].chunkIndex).toBe(0);
    });

    it('should create overlapping chunks', () => {
      const content = 'This is sentence one. This is sentence two. This is sentence three. This is sentence four.';
      const documentId = 'test-doc';
      const metadata = {
        fileName: 'test.txt',
        fileType: 'txt',
        fileSize: content.length
      } as any;

      // Use smaller chunk size for testing
      const testProcessor = new DocumentProcessor({
        maxChunkSize: 50,
        chunkOverlap: 20,
        preserveStructure: false
      });

      const chunks = testProcessor.chunkDocument(documentId, content, metadata);

      if (chunks.length > 1) {
        // Check that there's some overlap between consecutive chunks
        const firstChunkEnd = chunks[0].content.slice(-20);
        const secondChunkStart = chunks[1].content.slice(0, 20);
        
        // There should be some common content due to overlap
        expect(chunks[0].endPosition).toBeGreaterThan(chunks[1].startPosition);
      }
    });

    it('should preserve structure when configured', () => {
      const content = 'Paragraph one.\n\nParagraph two.\n\nParagraph three.';
      const documentId = 'test-doc';
      const metadata = {
        fileName: 'test.txt',
        fileType: 'txt',
        fileSize: content.length
      } as any;

      const chunks = processor.chunkDocument(documentId, content, metadata);

      // With structure preservation, each paragraph should be a separate chunk
      expect(chunks.length).toBe(3);
      expect(chunks[0].content.trim()).toBe('Paragraph one.');
      expect(chunks[1].content.trim()).toBe('Paragraph two.');
      expect(chunks[2].content.trim()).toBe('Paragraph three.');
    });

    it('should include proper metadata for chunks', () => {
      const content = 'This is a test document with multiple words.';
      const documentId = 'test-doc';
      const metadata = {
        fileName: 'test.txt',
        fileType: 'txt',
        fileSize: content.length
      } as any;

      const chunks = processor.chunkDocument(documentId, content, metadata);

      expect(chunks[0].metadata.wordCount).toBeGreaterThan(0);
      expect(chunks[0].metadata.characterCount).toBe(chunks[0].content.length);
      expect(chunks[0].id).toContain(documentId);
    });
  });

  describe('getDocumentType', () => {
    it('should correctly identify document types', () => {
      expect(DocumentProcessor.getDocumentType('test.pdf')).toBe(DocumentType.PDF);
      expect(DocumentProcessor.getDocumentType('test.docx')).toBe(DocumentType.DOCX);
      expect(DocumentProcessor.getDocumentType('test.txt')).toBe(DocumentType.TXT);
      expect(DocumentProcessor.getDocumentType('test.html')).toBe(DocumentType.HTML);
      expect(DocumentProcessor.getDocumentType('test.md')).toBe(DocumentType.MD);
      expect(DocumentProcessor.getDocumentType('test.json')).toBe(DocumentType.JSON);
      expect(DocumentProcessor.getDocumentType('test.csv')).toBe(DocumentType.CSV);
    });

    it('should handle case insensitive extensions', () => {
      expect(DocumentProcessor.getDocumentType('test.PDF')).toBe(DocumentType.PDF);
      expect(DocumentProcessor.getDocumentType('test.TXT')).toBe(DocumentType.TXT);
    });

    it('should throw error for unsupported types', () => {
      expect(() => DocumentProcessor.getDocumentType('test.xyz')).toThrow('Unsupported file type');
    });
  });

  describe('metadata extraction', () => {
    it('should extract keywords from content', async () => {
      const content = 'artificial intelligence machine learning data science technology innovation';
      const buffer = Buffer.from(content, 'utf-8');
      
      const result = await processor.processDocument(buffer, 'test.txt', DocumentType.TXT);
      
      expect(result.metadata.keywords).toBeDefined();
      expect(result.metadata.keywords!.length).toBeGreaterThan(0);
      expect(result.metadata.keywords).toContain('artificial');
      expect(result.metadata.keywords).toContain('intelligence');
    });

    it('should generate summary from content', async () => {
      const content = 'This is the first sentence. This is the second sentence. This is the third sentence.';
      const buffer = Buffer.from(content, 'utf-8');
      
      const result = await processor.processDocument(buffer, 'test.txt', DocumentType.TXT);
      
      expect(result.metadata.summary).toBeDefined();
      expect(result.metadata.summary).toContain('This is the first sentence');
    });

    it('should detect language', async () => {
      const content = 'The quick brown fox jumps over the lazy dog.';
      const buffer = Buffer.from(content, 'utf-8');
      
      const result = await processor.processDocument(buffer, 'test.txt', DocumentType.TXT);
      
      expect(result.metadata.language).toBe('en');
    });
  });

  describe('text cleaning', () => {
    it('should normalize whitespace', async () => {
      const content = 'This   has    multiple     spaces\n\n\nand\n\n\nempty\n\n\nlines.';
      const buffer = Buffer.from(content, 'utf-8');
      
      const result = await processor.processDocument(buffer, 'test.txt', DocumentType.TXT);
      
      expect(result.content).not.toMatch(/\s{2,}/);
      expect(result.content).not.toMatch(/\n\s*\n\s*\n/);
    });

    it('should trim content', async () => {
      const content = '   \n  This is content with leading and trailing whitespace.  \n   ';
      const buffer = Buffer.from(content, 'utf-8');
      
      const result = await processor.processDocument(buffer, 'test.txt', DocumentType.TXT);
      
      expect(result.content).toBe('This is content with leading and trailing whitespace.');
    });
  });
});