import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Users, Target, Zap, Globe,
  Github, Twitter, Linkedin, Mail, ChevronRight,
  Briefcase, Calendar, ArrowUpRight
} from 'lucide-react';
import { aboutService } from '../services/aboutService';
import { NavHeader } from './NavHeader';

interface AboutPageProps {
  onNavigate?: (page: 'landing' | 'dashboard' | 'docs' | 'pricing' | 'about') => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const companyInfo = aboutService.getCompanyInfo();
  const team = aboutService.getTeamMembers();
  const values = aboutService.getCompanyValues();
  const milestones = aboutService.getMilestones();
  const stats = aboutService.getStats();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const filteredMilestones = selectedCategory === 'all'
    ? milestones
    : milestones.filter(m => m.type === selectedCategory);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white overflow-hidden">
      <NavHeader onNavigate={onNavigate} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute top-20 left-10 text-[200px] font-bold text-white/[0.02] pointer-events-none select-none">
          FORGE
        </div>

        <div className="container mx-auto max-w-6xl relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center justify-center p-3 bg-cyan-500/10 rounded-2xl mb-8 border border-cyan-500/20">
              <Shield className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight">
              Forging the Future of <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
                Software Security
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              {companyInfo.tagline}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="py-20 px-4 border-y border-gray-900 bg-gray-900/20">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-sm font-medium text-cyan-500 uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="sticky top-24"
            >
              <h2 className="text-4xl font-bold mb-6">Our Mission</h2>
              <p className="text-xl text-gray-400 leading-relaxed mb-8">
                {companyInfo.mission}
              </p>
              <div className="h-1 w-20 bg-cyan-500 rounded-full"></div>
            </motion.div>

            <div className="grid gap-6">
              {values.map((value, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gray-900 p-8 rounded-2xl border border-gray-800 hover:border-cyan-500/30 transition-colors group"
                >
                  <div className="mb-4 p-3 bg-gray-800 rounded-lg inline-block text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{value.title}</h3>
                  <p className="text-gray-400">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Timeline */}
      <section className="py-24 px-4 bg-[#050508]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Journey</h2>
            <div className="flex flex-wrap justify-center gap-2 mt-8">
              {['all', 'launch', 'funding', 'product', 'team'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cat
                      ? 'bg-white text-black'
                      : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                    }`}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-px bg-gray-800 md:-translate-x-1/2"></div>

            <div className="space-y-12">
              {filteredMilestones.map((m, i) => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className={`flex flex-col md:flex-row gap-8 md:gap-0 relative ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
                >
                  {/* Dot */}
                  <div className="absolute left-[16px] md:left-1/2 top-0 w-2.5 h-2.5 bg-cyan-500 rounded-full md:-translate-x-1/2 z-10 box-content border-4 border-[#050508]"></div>

                  <div className="md:w-1/2 pl-12 md:pl-0 md:px-12">
                    <div className={`flex flex-col ${i % 2 === 0 ? 'md:items-start md:text-left' : 'md:items-end md:text-right'}`}>
                      <span className="text-cyan-500 font-mono font-bold mb-2 block">{m.date}</span>
                      <h3 className="text-2xl font-bold text-white mb-2">{m.title}</h3>
                      <p className="text-gray-400">{m.description}</p>
                    </div>
                  </div>
                  <div className="md:w-1/2"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Grid */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Built by Experts</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              We are a team of security researchers, hackers, and engineers obsessed with code quality.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, i) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-8 hover:border-blue-500/50 transition-colors">
                  <div className="text-6xl mb-6 grayscale group-hover:grayscale-0 transition-all duration-500">
                    {member.avatar}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                  <p className="text-blue-400 font-medium mb-4">{member.role}</p>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    {member.bio}
                  </p>
                  <div className="flex gap-4">
                    {Object.entries(member.social).map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url}
                        className="text-gray-500 hover:text-white transition-colors"
                        target="_blank" rel="noreferrer"
                      >
                        <ArrowUpRight className="w-5 h-5" />
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-gray-900 text-center">
        <p className="text-gray-600">© 2025 FuzzForge Security Inc.</p>
      </footer>
    </div>
  );
};
