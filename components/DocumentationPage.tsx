import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ChevronRight, Clock, Tag, BookOpen, 
  ExternalLink, Copy, Check, Menu, X, ArrowLeft, Shield
} from 'lucide-react';
import { documentationService, DocSection, DocItem } from '../services/documentationService';

interface DocumentationPageProps {
  onNavigate?: (page: 'landing' | 'dashboard' | 'docs' | 'pricing' | 'about') => void;
}

export const DocumentationPage: React.FC<DocumentationPageProps> = ({ onNavigate }) => {
  const [sections] = useState<DocSection[]>(documentationService.getDocSections());
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DocItem[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Set first doc as default
    if (sections.length > 0 && sections[0].items.length > 0 && !selectedDoc) {
      setSelectedDoc(sections[0].items[0]);
    }
  }, [sections, selectedDoc]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      const results = documentationService.searchDocs(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const renderMarkdown = (content: string) => {
    // Simple markdown renderer (in production, use a library like react-markdown)
    const lines = content.split('\n');
    const elements: React.ReactElement[] = [];
    let inCodeBlock = false;
    let codeBlockContent = '';
    let codeLanguage = '';

    lines.forEach((line, index) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <div key={`code-${index}`} className="relative my-4 rounded-lg bg-slate-900 p-4">
              <button
                onClick={() => handleCopyCode(codeBlockContent, `code-${index}`)}
                className="absolute right-2 top-2 rounded bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
              >
                {copiedCode === `code-${index}` ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
              <pre className="overflow-x-auto">
                <code className={`language-${codeLanguage} text-sm text-slate-300`}>
                  {codeBlockContent}
                </code>
              </pre>
            </div>
          );
          codeBlockContent = '';
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeLanguage = line.replace('```', '').trim();
        }
      } else if (inCodeBlock) {
        codeBlockContent += line + '\n';
      } else if (line.startsWith('# ')) {
        elements.push(
          <h1 key={index} className="text-4xl font-bold text-white mb-6 mt-8">
            {line.replace('# ', '')}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={index} className="text-3xl font-bold text-white mb-4 mt-8">
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="text-2xl font-semibold text-white mb-3 mt-6">
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <li key={index} className="text-slate-300 ml-6 mb-2">
            {line.replace(/^[*-] /, '')}
          </li>
        );
      } else if (line.trim()) {
        elements.push(
          <p key={index} className="text-slate-300 mb-4 leading-relaxed">
            {line}
          </p>
        );
      }
    });

    return elements;
  };

  const relatedDocs = selectedDoc 
    ? documentationService.getRelatedDocs(selectedDoc.id)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onNavigate && (
                <motion.button
                  onClick={() => onNavigate('landing')}
                  whileHover={{ scale: 1.05, x: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
                  title="Back to Home"
                >
                  <ArrowLeft className="w-5 h-5" />
                </motion.button>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden rounded-lg bg-slate-800 p-2 text-white hover:bg-slate-700"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate?.('landing')}>
                <Shield className="h-8 w-8 text-blue-400" />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                    FuzzForge
                  </h1>
                  <p className="text-xs text-slate-400">Documentation</p>
                </div>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative hidden md:block w-96">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg bg-slate-800 py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              {/* Search Results Dropdown */}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 w-full rounded-lg bg-slate-800 border border-slate-700 shadow-xl overflow-hidden"
                  >
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => {
                          setSelectedDoc(result);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0"
                      >
                        <div className="font-medium text-white">{result.title}</div>
                        <div className="text-sm text-slate-400">{result.category}</div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <AnimatePresence>
            {(sidebarOpen || window.innerWidth >= 1024) && (
              <motion.aside
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                className="fixed lg:sticky top-20 left-0 h-[calc(100vh-5rem)] w-80 overflow-y-auto bg-slate-900/95 lg:bg-transparent backdrop-blur-lg lg:backdrop-blur-none p-4 lg:p-0 z-40"
              >
                <nav className="space-y-6">
                  {sections.map((section) => (
                    <div key={section.id}>
                      <div className="mb-3 flex items-center space-x-2">
                        <span className="text-2xl">{section.icon}</span>
                        <h3 className="font-semibold text-white">{section.title}</h3>
                      </div>
                      <div className="space-y-1">
                        {section.items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setSelectedDoc(item);
                              setSidebarOpen(false);
                            }}
                            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                              selectedDoc?.id === item.id
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            {item.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </nav>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {selectedDoc && (
                <motion.div
                  key={selectedDoc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="rounded-lg bg-slate-800/50 backdrop-blur-sm p-8"
                >
                  {/* Doc Header */}
                  <div className="mb-8 border-b border-slate-700 pb-6">
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      {selectedDoc.tags.map((tag) => (
                        <span
                          key={tag}
                          className="flex items-center space-x-1 rounded-full bg-blue-600/20 px-3 py-1 text-sm text-blue-400"
                        >
                          <Tag className="h-3 w-3" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-slate-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{selectedDoc.readTime}</span>
                      </div>
                      <span>•</span>
                      <span>Updated {selectedDoc.lastUpdated}</span>
                    </div>
                  </div>

                  {/* Doc Content */}
                  <article className="prose prose-invert max-w-none">
                    {renderMarkdown(selectedDoc.content)}
                  </article>

                  {/* Code Examples */}
                  {selectedDoc.code && selectedDoc.code.length > 0 && (
                    <div className="mt-12">
                      <h3 className="text-2xl font-bold text-white mb-6">Code Examples</h3>
                      {selectedDoc.code.map((example, index) => (
                        <div key={index} className="mb-6">
                          {example.title && (
                            <h4 className="text-lg font-semibold text-white mb-3">{example.title}</h4>
                          )}
                          <div className="relative rounded-lg bg-slate-900 p-4">
                            <button
                              onClick={() => handleCopyCode(example.code, `example-${index}`)}
                              className="absolute right-2 top-2 rounded bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                            >
                              {copiedCode === `example-${index}` ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                            <pre className="overflow-x-auto">
                              <code className={`language-${example.language} text-sm text-slate-300`}>
                                {example.code}
                              </code>
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Related Docs */}
                  {relatedDocs.length > 0 && (
                    <div className="mt-12 rounded-lg bg-slate-900/50 p-6">
                      <h3 className="text-xl font-bold text-white mb-4">Related Documentation</h3>
                      <div className="grid gap-3 md:grid-cols-2">
                        {relatedDocs.map((doc) => (
                          <button
                            key={doc.id}
                            onClick={() => setSelectedDoc(doc)}
                            className="group flex items-center justify-between rounded-lg bg-slate-800 p-4 text-left hover:bg-slate-700 transition-colors"
                          >
                            <div>
                              <div className="font-medium text-white">{doc.title}</div>
                              <div className="text-sm text-slate-400">{doc.readTime}</div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feedback */}
                  <div className="mt-12 rounded-lg border border-slate-700 bg-slate-900/30 p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Was this helpful?</h4>
                    <div className="flex items-center space-x-4">
                      <button className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors">
                        👍 Yes
                      </button>
                      <button className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors">
                        👎 No
                      </button>
                      <a
                        href="https://github.com/fuzzforge/docs"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <span>Edit on GitHub</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};
