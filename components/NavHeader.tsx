import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Menu, X, ChevronDown, Github, Twitter, Linkedin, Mail, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavHeaderProps {
  onGetStarted?: () => void;
  onLogin?: () => void;
  onNavigate?: (page: 'landing' | 'dashboard' | 'docs' | 'pricing' | 'about') => void;
  transparent?: boolean;
}

export const NavHeader: React.FC<NavHeaderProps> = ({
  onGetStarted,
  onLogin,
  onNavigate,
  transparent = false
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { isAuthenticated, user, logout } = useAuth();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

  const navLinks = [
    {
      name: 'Features',
      href: '#features',
      dropdown: [
        { name: 'AST Analysis', href: '#ast-analysis', icon: '🔍', desc: 'Deep code parsing' },
        { name: 'Dynamic Fuzzing', href: '#fuzzing', icon: '⚡', desc: 'Runtime testing' },
        { name: 'CVE Matching', href: '#cve', icon: '🛡️', desc: 'Threat intelligence' },
        { name: 'Knowledge Graph', href: '#graph', icon: '🕸️', desc: 'Visual mapping' },
      ]
    },
    { name: 'Pricing', href: 'pricing', page: 'pricing' as const },
    { name: 'Docs', href: 'docs', page: 'docs' as const },
    { name: 'About', href: 'about', page: 'about' as const },
  ];

  const handleNavClick = (href: string, page?: 'docs' | 'pricing' | 'about') => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);

    if (page && onNavigate) {
      onNavigate(page);
      return;
    }

    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${isScrolled || !transparent || isMobileMenuOpen
            ? 'bg-gray-900/80 backdrop-blur-xl border-gray-800 shadow-lg shadow-black/20'
            : 'bg-transparent border-transparent'
          }`}
      >
        <div className="container mx-auto px-6">
          {/* Main Bar */}
          <div className="flex items-center justify-between h-20 md:h-24">

            {/* Logo */}
            <motion.div
              className="flex items-center gap-3 cursor-pointer group"
              whileHover={{ scale: 1.02 }}
              onClick={() => onNavigate?.('landing')}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Shield className="w-10 h-10 text-white relative z-10" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 border border-blue-400/30 rounded-full z-0"
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold tracking-tight text-white group-hover:text-blue-200 transition-colors">
                  FuzzForge
                </h1>
                <span className="text-[10px] uppercase tracking-widest text-blue-400 font-semibold">Security AI</span>
              </div>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-10">
              {navLinks.map((link) => (
                <div
                  key={link.name}
                  className="relative group"
                  onMouseEnter={() => link.dropdown && setActiveDropdown(link.name)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <motion.a
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(link.href, (link as any).page);
                    }}
                    className="text-gray-300 hover:text-white transition-colors font-medium text-sm tracking-wide flex items-center gap-1 py-4"
                  >
                    {link.name}
                    {link.dropdown && (
                      <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${activeDropdown === link.name ? 'rotate-180 text-blue-400' : ''
                        }`} />
                    )}
                  </motion.a>

                  {/* Indicator Line */}
                  <span className="absolute bottom-2 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full opacity-0 group-hover:opacity-100"></span>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {link.dropdown && activeDropdown === link.name && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full -left-4 mt-0 w-72 bg-[#0A0A0F] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden p-2 z-50"
                      >
                        <div className="absolute inset-0 bg-blue-500/5 pointer-events-none"></div>
                        {link.dropdown.map((item, index) => (
                          <motion.a
                            key={item.name}
                            href={item.href}
                            onClick={(e) => {
                              e.preventDefault();
                              handleNavClick(item.href);
                            }}
                            className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group/item"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <div className="p-2 bg-gray-900 rounded-lg border border-gray-800 group-hover/item:border-blue-500/50 transition-colors">
                              <span className="text-xl">{item.icon}</span>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white group-hover/item:text-blue-400 transition-colors">{item.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                            </div>
                          </motion.a>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center gap-6">
              {!isAuthenticated ? (
                <>
                  <button
                    onClick={onLogin}
                    className="text-sm font-semibold text-gray-300 hover:text-white transition-colors"
                  >
                    Log In
                  </button>
                  <motion.button
                    onClick={onGetStarted}
                    whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(59, 130, 246, 0.5)' }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-2.5 bg-white text-black rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors"
                  >
                    Get Started
                  </motion.button>
                </>
              ) : (
                <div className="flex items-center gap-4 pl-6 border-l border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden xl:block">
                      <p className="text-sm font-bold text-white">
                        {user?.firstName || user?.username}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Authenticated</p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg border border-white/10 flex items-center justify-center text-white font-bold shadow-lg">
                      {(user?.firstName?.[0] || user?.username[0] || 'U').toUpperCase()}
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                    title="Logout"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-white bg-white/5 rounded-lg border border-white/10"
              whileTap={{ scale: 0.9 }}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: '100vh' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="lg:hidden bg-[#0A0A0F] border-t border-gray-800 absolute top-full left-0 right-0 overflow-y-auto pb-20"
            >
              <div className="p-6 space-y-6">
                {/* Mobile Nav Links */}
                <div className="space-y-1">
                  {navLinks.map((link, i) => (
                    <div key={link.name} className="overflow-hidden">
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <a
                          href={link.href}
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavClick(link.href, (link as any).page);
                          }}
                          className="block text-2xl font-bold text-white py-4 border-b border-gray-800 hover:text-blue-400 transition-colors"
                        >
                          {link.name}
                        </a>
                        {link.dropdown && (
                          <div className="pl-4 py-2 space-y-3">
                            {link.dropdown.map(d => (
                              <a key={d.name} href={d.href} onClick={(e) => { e.preventDefault(); handleNavClick(d.href); }} className="block text-gray-400 text-sm hover:text-white">
                                {d.name}
                              </a>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    </div>
                  ))}
                </div>

                {/* Mobile CTA */}
                <div className="pt-8 space-y-4">
                  {!isAuthenticated ? (
                    <>
                      <button
                        onClick={() => { setIsMobileMenuOpen(false); onLogin?.(); }}
                        className="w-full py-4 rounded-xl border border-gray-700 text-white font-bold hover:bg-gray-800 transition-colors"
                      >
                        Log In
                      </button>
                      <button
                        onClick={() => { setIsMobileMenuOpen(false); onGetStarted?.(); }}
                        className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/50"
                      >
                        Get Started
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); logout(); }}
                      className="w-full py-4 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 font-bold"
                    >
                      Log Out
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Spacer */}
      <div className={`h-20 md:h-24 ${transparent && !isScrolled && !isMobileMenuOpen ? 'hidden' : 'block'}`}></div>
    </>
  );
};
