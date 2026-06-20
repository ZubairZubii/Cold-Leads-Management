'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { parseApolloCSV, ParsedLead } from '@/lib/csv-parser';
import { qualifyLeads, QualifiedLead } from '@/lib/lead-qualification';
import { PAIN_POINT_HOOK_MAP } from '@/lib/pain-point-hooks';

export default function LeadQualifier() {
  const [qualifiedLeads, setQualifiedLeads] = useState<QualifiedLead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fileCount, setFileCount] = useState(0);

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files) return;

    setIsLoading(true);
    try {
      let allParsedLeads: ParsedLead[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const text = await file.text();
        const leads = parseApolloCSV(text);
        allParsedLeads = allParsedLeads.concat(leads);
      }

      const qualified = qualifyLeads(allParsedLeads, PAIN_POINT_HOOK_MAP);
      setQualifiedLeads(qualified);
      setFileCount(files.length);
    } catch (error) {
      console.error('Error processing files:', error);
      alert('Error processing files. Please check the file format.');
    } finally {
      setIsLoading(false);
    }
  }

  function downloadJSON() {
    const data = {
      qualified: qualifiedLeads,
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qualified-leads.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Lead Qualifier</h1>
        <p className="text-muted-foreground">
          Upload Apollo CSV exports to automatically qualify leads and generate outreach messaging
        </p>
      </div>

      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center space-y-4 hover:border-primary/50 transition-colors">
        <input
          type="file"
          multiple
          accept=".csv"
          onChange={handleFileUpload}
          disabled={isLoading}
          className="hidden"
          id="csv-upload"
        />
        <label htmlFor="csv-upload" className="cursor-pointer block">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {isLoading ? 'Processing files...' : 'Upload Apollo CSV Files'}
            </p>
            <p className="text-xs text-muted-foreground">
              Drag and drop or click to select CSV files
            </p>
          </div>
        </label>
      </div>

      {fileCount > 0 && (
        <div className="bg-secondary/50 rounded-lg p-4">
          <p className="text-sm text-foreground">
            Processed {fileCount} file{fileCount !== 1 ? 's' : ''} • Found{' '}
            <span className="font-semibold">{qualifiedLeads.length}</span> qualified leads
          </p>
        </div>
      )}

      {qualifiedLeads.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-foreground">Qualified Leads</h2>
            <Button onClick={downloadJSON} variant="default" className="gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2m0 0v-8m0 8l-6-4m6 4l6-4"
                />
              </svg>
              Download JSON
            </Button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {qualifiedLeads.map((lead, index) => (
              <div
                key={index}
                className="border border-border rounded-lg p-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Name</p>
                    <p className="font-medium text-foreground">{lead.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Title</p>
                    <p className="font-medium text-foreground">{lead.title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Company</p>
                    <p className="text-sm text-foreground">{lead.company}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
                    <p className="text-sm text-foreground">{lead.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Location</p>
                    <p className="text-sm text-foreground">{lead.location}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Industry</p>
                    <p className="text-sm text-foreground">{lead.industry}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Pain Point
                    </p>
                    <p className="text-sm text-foreground">{lead.pain_point}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Hook
                    </p>
                    <p className="text-sm text-foreground">{lead.hook}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && qualifiedLeads.length === 0 && fileCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-900">
            No qualified leads found. Make sure your CSV files contain valid email addresses and
            decision-maker titles (founder, CEO, CTO, VP, president, co-founder, etc.).
          </p>
        </div>
      )}
    </div>
  );
}
