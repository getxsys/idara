'use client'

import React from 'react'
import { NLQueryInterface } from '@/components/dashboard'
import { DashboardLayout } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Sparkles, TrendingUp } from 'lucide-react'

export default function AIInsightsPage() {
  // Mock user ID - in a real app, this would come from authentication
  const userId = 'demo-user-123'

  // Mock context for better AI suggestions
  const context = {
    currentDashboard: 'main-dashboard',
    userRole: 'analyst',
    businessContext: {
      industry: 'e-commerce',
      companySize: 'medium',
      primaryMetrics: ['revenue', 'conversion', 'customers', 'orders']
    }
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Brain className="h-8 w-8 text-blue-600" />
              AI-Powered Insights
            </h1>
            <p className="text-gray-600 mt-2">
              Ask questions about your business data in natural language
            </p>
          </div>
        </div>

        {/* Feature Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                Natural Language Queries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Ask questions in plain English like "What's our revenue this month?" 
                or "Show me customer trends"
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Smart Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Get AI-generated insights and recommendations based on your data patterns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                Query History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Save frequently used queries and access your query history for quick reference
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main NL Query Interface */}
        <NLQueryInterface 
          userId={userId}
          context={context}
          className="max-w-none"
        />

        {/* Usage Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              💡 Tips for Better Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Example Questions:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• "What's our revenue trend this quarter?"</li>
                  <li>• "How many new customers did we get last month?"</li>
                  <li>• "Compare sales performance vs last year"</li>
                  <li>• "Show me top performing products"</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Best Practices:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Be specific about time periods</li>
                  <li>• Use business terms you're familiar with</li>
                  <li>• Ask follow-up questions for deeper insights</li>
                  <li>• Save useful queries for future reference</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}