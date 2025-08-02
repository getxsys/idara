'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestClientAPI() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: 'Test Client',
    email: 'test@example.com',
    phone: '123-456-7890',
    company: 'Test Company'
  });

  const testAPI = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Testing API with data:', formData);

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers));

      const responseText = await response.text();
      console.log('Response text:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      if (!response.ok) {
        throw new Error(`API Error (${response.status}): ${responseData.error || responseData.details || 'Unknown error'}`);
      }

      setResult(responseData);
      console.log('✅ Success:', responseData);

    } catch (error) {
      console.error('❌ Error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const testDatabaseConnection = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/clients', {
        method: 'GET',
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(`API Error: ${responseData.error}`);
      }

      setResult({ message: 'Database connection successful', clients: responseData.clients });

    } catch (error) {
      console.error('Database test error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Client API Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Test Buttons */}
          <div className="flex space-x-4">
            <Button onClick={testAPI} disabled={isLoading}>
              {isLoading ? 'Testing...' : 'Test Create Client'}
            </Button>
            <Button onClick={testDatabaseConnection} disabled={isLoading} variant="outline">
              {isLoading ? 'Testing...' : 'Test Database Connection'}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <h4 className="font-semibold">Error:</h4>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              <h4 className="font-semibold">Success:</h4>
              <pre className="text-sm mt-2 overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
            <h4 className="font-semibold">Instructions:</h4>
            <ul className="text-sm mt-2 list-disc list-inside">
              <li>First test the database connection to make sure it's working</li>
              <li>Then test creating a client with the form data</li>
              <li>Check the browser console for detailed logs</li>
              <li>Check the server console for API logs</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}