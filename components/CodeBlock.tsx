
import React from 'react';

interface CodeBlockProps {
  code: string;
  language: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700 relative">
      <div className="absolute top-2 right-3 text-xs text-gray-500 font-mono">{language}</div>
      <pre className="p-4 text-sm text-gray-200 overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
