import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronRight, Clock, Tag, BookOpen,
  Copy, Check, Menu, X, ArrowLeft, Shield, FileText, Hash
} from 'lucide-react';
import { documentationService, DocSection, DocItem } from '../services/documentationService';
import { NavHeader } from './NavHeader';

interface DocumentationPageProps {
  onNavigate?: (page: 'landing' | 'dashboard' | 'docs' | 'pricing' | 'about') => void;
}

export const DocumentationPage: React.FC<DocumentationPageProps> = ({ onNavigate }) => {
  const [sections] = useState<DocSection[]>(documentationService.getDocSections());
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DocItem[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
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
    return content.split('\n').map((line, index) => {
      if (line.startsWith('# ')) return <h1 key={index} className="text-4xl font-bold mb-6 mt-10 text-white tracking-tight border-b border-gray-800 pb-4">{line.replace('# ', '')}</h1>;
      if (line.startsWith('## ')) return <h2 key={index} className="text-2xl font-bold mb-4 mt-8 text-white flex items-center gap-2"><span className="text-blue-500">##</span> {line.replace('## ', '')}</h2>;
      if (line.startsWith('### ')) return <h3 key={index} className="text-xl font-semibold mb-3 mt-6 text-gray-200">{line.replace('### ', '')}</h3>;
      if (line.startsWith('- ')) return <li key={index} className="ml-4 mb-2 text-gray-300 list-disc marker:text-blue-500">{line.replace('- ', '')}</li>;
      if (line.trim() === '') return <div key={index} className="h-4"></div>;
      return <p key={index} className="mb-3 text-gray-300 leading-7 text-lg">{line}</p>;
    });
  };

  const relatedDocs = selectedDoc
    ? documentationService.getRelatedDocs(selectedDoc.id)
    : [];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-gray-300">
      <NavHeader onNavigate={onNavigate} />

      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-12">

            {/* Mobile Menu Button (visible only on small screens) */}
            <button
              className="lg:hidden flex items-center gap-2 text-white mb-4 bg-gray-800 p-3 rounded-lg w-full"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu /> {mobileMenuOpen ? 'Close Menu' : 'Browse Topics'}
            </button>

            {/* Sidebar Navigation */}
            <aside className={`lg:w-72 flex-shrink-0 ${mobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
              <div className="sticky top-28 space-y-8">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-colors text-white placeholder-gray-600"
                  />
                  {/* Search Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A23] border border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden">
                      {searchResults.map(result => (
                        <button
                          key={result.id}
                          onClick={() => { setSelectedDoc(result); setSearchQuery(''); }}
                          className="w-full text-left px-4 py-3 hover:bg-blue-600/20 text-sm transition-colors block border-b border-gray-800 last:border-0"
                        >
                          <span className="font-bold text-white block">{result.title}</span>
                          <span className="text-xs text-gray-400">{result.category}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Nav Items */}
                <nav className="space-y-6">
                  {sections.map(section => (
                    <div key={section.id}>
                      <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-500 uppercase tracking-widest pl-2">
                        <span className="text-lg">{section.icon}</span> {section.title}
                      </div>
                      <div className="space-y-1">
                        {section.items.map(item => (
                          <button
                            key={item.id}
                            onClick={() => { setSelectedDoc(item); setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all border-l-2 ${selectedDoc?.id === item.id
                                ? 'bg-blue-900/10 text-blue-400 border-blue-500 font-medium'
                                : 'text-gray-400 hover:text-white border-transparent hover:bg-gray-800'
                              }`}
                          >
                            {item.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                {selectedDoc && (
                  <motion.div
                    key={selectedDoc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Breadcrumb & Header */}
                    <div className="mb-10">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <span>Docs</span>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-blue-400">{selectedDoc.category}</span>
                      </div>
                      <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">{selectedDoc.title}</h1>

                      <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 pb-8 border-b border-gray-800">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {selectedDoc.readTime} read
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Last updated: {selectedDoc.lastUpdated}
                        </div>
                        <div className="flex gap-2">
                          {selectedDoc.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 text-xs border border-gray-700">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Content Body */}
                    <article className="prose prose-invert max-w-none text-gray-300">
                      {renderMarkdown(selectedDoc.content)}
                    </article>

                    {/* Code Snippets */}
                    {selectedDoc.code && selectedDoc.code.map((snippet, idx) => (
                      <div key={idx} className="my-8 rounded-xl overflow-hidden border border-gray-800 bg-[#0F0F16] shadow-2xl">
                        <div className="flex items-center justify-between px-4 py-3 bg-[#181820] border-b border-gray-800">
                          <span className="text-xs font-mono text-gray-400">{snippet.language}</span>
                          <button
                            onClick={() => handleCopyCode(snippet.code, `code-${idx}`)}
                            className="text-gray-500 hover:text-white transition-colors"
                          >
                            {copiedCode === `code-${idx}` ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                        <div className="p-6 overflow-x-auto">
                          <pre className="text-sm font-mono text-blue-100 leading-relaxed">
                            <code>{snippet.code}</code>
                          </pre>
                        </div>
                      </div>
                    ))}

                    {/* Feedback & Footer */}
                    <div className="mt-20 pt-10 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-6">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">Was this helpful?</span>
                        <button className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-full text-sm hover:border-green-500 hover:text-green-400 transition-colors">👍 Yes</button>
                        <button className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-full text-sm hover:border-red-500 hover:text-red-400 transition-colors">👎 No</button>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>

            {/* Right Sidebar (On This Page) - Hidden on Mobile */}
            <aside className="hidden xl:block w-64 flex-shrink-0">
              <div className="sticky top-28">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">On This Page</h4>
                <ul className="space-y-3 border-l border-gray-800 pl-4">
                  {selectedDoc?.content.split('\n').filter(l => l.startsWith('## ')).map((header, i) => (
                    <li key={i}>
                      <a href="#" className="text-sm text-gray-500 hover:text-blue-400 transition-colors block">
                        {header.replace('## ', '')}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

          </div>
        </div>
      </div>
    </div>
  );
};
