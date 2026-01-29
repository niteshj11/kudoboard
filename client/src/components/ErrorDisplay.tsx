import { useState, useEffect } from 'react';
import { X, AlertTriangle, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

export interface DetailedError {
  message: string;
  error: string;
  stack?: string;
  file?: string;
  line?: number;
  column?: number;
  functionName?: string;
  timestamp: string;
  environment: string;
}

interface ErrorDisplayProps {
  error: DetailedError;
  onClose: () => void;
}

export default function ErrorDisplay({ error, onClose }: ErrorDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [showFullStack, setShowFullStack] = useState(true);

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const copyToClipboard = () => {
    const errorText = `
Error: ${error.error}
Message: ${error.message}
File: ${error.file || 'Unknown'}
Line: ${error.line || 'Unknown'}
Column: ${error.column || 'Unknown'}
Function: ${error.functionName || 'Unknown'}
Timestamp: ${error.timestamp}
Environment: ${error.environment}

Stack Trace:
${error.stack || 'No stack trace available'}
    `.trim();
    
    navigator.clipboard.writeText(errorText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-semibold">Development Error</h2>
              <p className="text-red-100 text-sm">{error.environment} environment</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-red-500 rounded-lg transition-colors"
              title="Copy error details"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-500 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Error Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-semibold mb-1">Error Message</h3>
            <p className="text-red-700 font-mono text-sm">{error.error}</p>
          </div>

          {/* Location Info */}
          {(error.file || error.line) && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="text-amber-800 font-semibold mb-2">Location</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {error.file && (
                  <div>
                    <span className="text-amber-600">File:</span>
                    <span className="ml-2 font-mono text-amber-900 break-all">{error.file}</span>
                  </div>
                )}
                {error.line && (
                  <div>
                    <span className="text-amber-600">Line:</span>
                    <span className="ml-2 font-mono text-amber-900">{error.line}</span>
                    {error.column && <span className="text-amber-600">:{error.column}</span>}
                  </div>
                )}
                {error.functionName && (
                  <div className="col-span-2">
                    <span className="text-amber-600">Function:</span>
                    <span className="ml-2 font-mono text-amber-900">{error.functionName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stack Trace */}
          {error.stack && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowFullStack(!showFullStack)}
                className="w-full px-4 py-3 flex items-center justify-between text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <h3 className="font-semibold">Stack Trace</h3>
                {showFullStack ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              {showFullStack && (
                <pre className="px-4 pb-4 text-xs font-mono text-slate-700 overflow-x-auto whitespace-pre-wrap">
                  {error.stack}
                </pre>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 className="text-slate-700 font-semibold mb-2">Metadata</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-500">Timestamp:</span>
                <span className="ml-2 font-mono text-slate-700">{new Date(error.timestamp).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500">Operation:</span>
                <span className="ml-2 font-mono text-slate-700">{error.message}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex justify-between items-center">
          <p className="text-sm text-slate-500">
            This detailed error is only shown in development mode.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
