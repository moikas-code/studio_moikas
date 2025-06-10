'use client';

import React from 'react';

export default function ModelManagementPage() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold">Model Management (Debug Mode)</h1>
      <p>If you can see this, the basic page is working.</p>
      
      <div className="mt-4">
        <button 
          className="btn btn-primary"
          onClick={() => window.location.href = '/admin'}
        >
          Back to Admin
        </button>
      </div>
    </div>
  );
}