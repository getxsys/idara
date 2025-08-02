'use client';

import React from 'react';
import SimpleClientList from '@/components/clients/SimpleClientList';

export default function TestCrudPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Client CRUD Operations Test</h1>
        <p className="text-muted-foreground mt-2">
          Test the complete Create, Read, Update, Delete functionality for clients.
        </p>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> This is a standalone test page for CRUD operations. 
            Use the buttons in the table to edit or delete clients directly.
            Toast notifications will appear in the top-right corner.
          </p>
        </div>
      </div>
      
      <SimpleClientList />
    </div>
  );
}