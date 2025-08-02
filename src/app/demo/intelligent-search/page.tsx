'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IntelligentSearchInterface } from '@/components/search/IntelligentSearchInterface';
import { FileText, Database, Search, TrendingUp, Users, Calendar } from 'lucide-react';
import {
  RAGQuery,
  RAGResponse,
  DocumentSource,
  AccessLevel,
  QueryContext
} from '@/types/rag';

// Mock data for demonstration
const mockDocuments: DocumentSource[] = [
  {
    documentId: 'doc_1',
    title: 'Q4 2024 Business Strategy Document',
    chunkId: 'chunk_1',
    content: 'Our Q4 strategy focuses on expanding into emerging markets with a particular emphasis on sustainable growth. We plan to increase our market share by 15% through strategic partnerships and innovative product development. The key pillars of our strategy include digital transformation, customer experience enhancement, and operational efficiency improvements.',
    relevanceScore: 0.95,
    metadata: {
      fileName: 'q4-strategy-2024.pdf',
      fileType: 'pdf',
      fileSize: 2048000,
      author: 'Sarah Johnson',
      createdDate: new Date('2024-01-15'),
      modifiedDate: new Date('2024-01-20'),
      language: 'en',
      category: 'strategy',
      summary: 'Comprehensive business strategy for Q4 2024',
      keywords: ['strategy', 'growth', 'market expansion', 'digital transformation']
    },
    citation: 'Q4 2024 Business Strategy Document by Sarah Johnson (1/15/2024)'
  },
  {
    documentId: 'doc_2',
    title: 'Market Analysis Report - Emerging Technologies',
    chunkId: 'chunk_2',
    content: 'The market analysis reveals significant opportunities in AI and machine learning sectors. Consumer adoption of AI-powered solutions has increased by 40% year-over-year. Key trends include automation in business processes, personalized customer experiences, and predictive analytics for decision making.',
    relevanceScore: 0.87,
    metadata: {
      fileName: 'market-analysis-ai-2024.pdf',
      fileType: 'pdf',
      fileSize: 1536000,
      author: 'Michael Chen',
      createdDate: new Date('2024-02-01'),
      modifiedDate: new Date('2024-02-05'),
      language: 'en',
      category: 'analysis',
      summary: 'Market analysis focusing on AI and emerging technologies',
      keywords: ['AI', 'machine learning', 'market trends', 'automation']
    },
    citation: 'Market Analysis Report - Emerging Technologies by Michael Chen (2/1/2024)'
  },
  {
    documentId: 'doc_3',
    title: 'Client Relationship Management Best Practices',
    chunkId: 'chunk_3',
    content: 'Effective client relationship management requires a combination of personalized communication, proactive service delivery, and continuous value creation. Our analysis shows that clients who receive regular check-ins and customized solutions have 60% higher retention rates.',
    relevanceScore: 0.82,
    metadata: {
      fileName: 'crm-best-practices.docx',
      fileType: 'docx',
      fileSize: 512000,
      author: 'Emily Rodriguez',
      createdDate: new Date('2024-01-28'),
      modifiedDate: new Date('2024-02-02'),
      language: 'en',
      category: 'client-management',
      summary: 'Best practices for managing client relationships',
      keywords: ['CRM', 'client retention', 'relationship management', 'customer service']
    },
    citation: 'Client Relationship Management Best Practices by Emily Rodriguez (1/28/2024)'
  }
];

const mockContext: QueryContext = {
  currentProject: 'project-demo-123',
  currentClient: 'client-demo-456',
  userRole: 'manager',
  workspaceId: 'workspace-demo-789',
  sessionId: 'session-demo-abc'
};

export default function IntelligentSearchDemo() {
  const [searchResults, setSearchResults] = useState<RAGResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [demoStats, setDemoStats] = useState({
    totalDocuments: 156,
    totalQueries: 1247,
    avgConfidence: 0.87,
    avgResponseTime: 1150
  });

  // Mock search function for demonstration
  const handleSearch = useCallback(async (query: RAGQuery): Promise<RAGResponse> => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    // Generate mock response based on query
    const queryLower = query.query.toLowerCase();
    let relevantDocs = mockDocuments;
    
    // Simple keyword matching for demo
    if (queryLower.includes('strategy') || queryLower.includes('business')) {
      relevantDocs = mockDocuments.filter(doc => 
        doc.content.toLowerCase().includes('strategy') || 
        doc.content.toLowerCase().includes('business')
      );
    } else if (queryLower.includes('market') || queryLower.includes('analysis')) {
      relevantDocs = mockDocuments.filter(doc => 
        doc.content.toLowerCase().includes('market') || 
        doc.content.toLowerCase().includes('analysis')
      );
    } else if (queryLower.includes('client') || queryLower.includes('customer')) {
      relevantDocs = mockDocuments.filter(doc => 
        doc.content.toLowerCase().includes('client') || 
        doc.content.toLowerCase().includes('customer')
      );
    }

    // Generate AI-like answer
    const generateAnswer = (docs: DocumentSource[], query: string) => {
      if (docs.length === 0) {
        return "I couldn't find specific information about your query in the available documents. You might want to try different keywords or check if the relevant documents have been indexed.";
      }
      
      const keyContent = docs.slice(0, 2).map(doc => 
        doc.content.substring(0, 100) + '...'
      ).join(' ');
      
      return `Based on the available documents, ${keyContent} This information comes from ${docs.length} relevant source${docs.length > 1 ? 's' : ''} in our knowledge base.`;
    };

    // Generate suggestions
    const generateSuggestions = (query: string) => {
      const suggestions = [
        'business growth strategies',
        'market expansion plans',
        'client retention techniques',
        'digital transformation roadmap',
        'competitive analysis framework',
        'customer experience optimization'
      ];
      
      return suggestions
        .filter(s => !s.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3);
    };

    const response: RAGResponse = {
      answer: generateAnswer(relevantDocs, query.query),
      sources: relevantDocs.slice(0, query.maxResults || 5),
      confidence: Math.max(0.6, Math.min(0.95, 0.7 + (relevantDocs.length * 0.1))),
      suggestions: generateSuggestions(query.query),
      processingTime: 800 + Math.floor(Math.random() * 800),
      queryId: `demo_query_${Date.now()}`
    };

    setIsLoading(false);
    setSearchResults(response);
    
    // Update demo stats
    setDemoStats(prev => ({
      ...prev,
      totalQueries: prev.totalQueries + 1,
      avgResponseTime: Math.floor((prev.avgResponseTime + response.processingTime) / 2),
      avgConfidence: Math.round(((prev.avgConfidence + response.confidence) / 2) * 100) / 100
    }));

    return response;
  }, []);

  const sampleQueries = [
    "What are our key business strategies for growth?",
    "How can we improve client retention rates?",
    "What market trends should we be aware of?",
    "What are the best practices for customer relationship management?",
    "How is AI impacting our industry?",
    "What are our competitive advantages?"
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Intelligent Search & Retrieval Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience AI-powered semantic search with contextual understanding, 
            intelligent ranking, and source citation across your business documents.
          </p>
          <div className="flex justify-center gap-4">
            <Badge variant="secondary" className="px-3 py-1">
              <Database className="h-4 w-4 mr-1" />
              RAG-Powered
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <Search className="h-4 w-4 mr-1" />
              Semantic Search
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              Intelligent Ranking
            </Badge>
          </div>
        </div>

        {/* Demo Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{demoStats.totalDocuments}</div>
              <div className="text-sm text-gray-600">Documents Indexed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{demoStats.totalQueries}</div>
              <div className="text-sm text-gray-600">Queries Processed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{Math.round(demoStats.avgConfidence * 100)}%</div>
              <div className="text-sm text-gray-600">Avg Confidence</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{demoStats.avgResponseTime}ms</div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </CardContent>
          </Card>
        </div>

        {/* Sample Queries */}
        <Card>
          <CardHeader>
            <CardTitle>Try These Sample Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sampleQueries.map((query, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="text-left justify-start h-auto p-3"
                  onClick={() => handleSearch({ query, userId: 'demo-user' })}
                >
                  <Search className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="text-sm">{query}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Search Interface */}
        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">Search Interface</TabsTrigger>
            <TabsTrigger value="context">Context Demo</TabsTrigger>
            <TabsTrigger value="features">Key Features</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <IntelligentSearchInterface
              onSearch={handleSearch}
              context={mockContext}
              className="max-w-none"
            />
          </TabsContent>

          <TabsContent value="context" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Context</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Role: {mockContext.userRole}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Project: {mockContext.currentProject}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Client: {mockContext.currentClient}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Workspace: {mockContext.workspaceId}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Context Benefits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      Context-aware search boosts relevant results by up to 40%
                    </AlertDescription>
                  </Alert>
                  <ul className="text-sm space-y-2">
                    <li>• Project-specific documents get higher relevance scores</li>
                    <li>• Role-based access control filters results automatically</li>
                    <li>• Client context prioritizes related documents</li>
                    <li>• Workspace isolation ensures data security</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-blue-500" />
                    Semantic Search
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Advanced vector similarity search that understands meaning and context, 
                    not just keywords. Find relevant information even with different terminology.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Intelligent Ranking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Multi-factor ranking algorithm considers relevance, recency, authority, 
                    and context to surface the most valuable results first.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-500" />
                    Source Citation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Every result includes detailed source information with confidence scores, 
                    allowing you to verify and trace information back to original documents.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-orange-500" />
                    Context Awareness
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Understands your current project, client, and role to provide 
                    contextually relevant results and apply appropriate access controls.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-red-500" />
                    Advanced Filtering
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Comprehensive filtering by document type, category, date range, 
                    author, and access level to narrow down results precisely.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-500" />
                    Search Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Built-in analytics track search patterns, performance metrics, 
                    and user behavior to continuously improve search quality.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">
              This demo showcases the intelligent search and retrieval interface built for the 
              Modern Business Dashboard. The system uses RAG (Retrieval-Augmented Generation) 
              technology to provide accurate, contextual, and cited responses from your business documents.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}