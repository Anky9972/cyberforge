import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, Users, Target, Heart, Zap, Globe, 
  Github, Twitter, Linkedin, Mail, ChevronRight,
  Building, Award, TrendingUp, Briefcase, Calendar, ArrowLeft
} from 'lucide-react';
import { aboutService } from '../services/aboutService';

interface AboutPageProps {
  onNavigate?: (page: 'landing' | 'dashboard' | 'docs' | 'pricing' | 'about') => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const companyInfo = aboutService.getCompanyInfo();
  const team = aboutService.getTeamMembers();
  const values = aboutService.getCompanyValues();
  const milestones = aboutService.getMilestones();
  const stats = aboutService.getStats();
  const press = aboutService.getPressReleases();
  const careers = aboutService.getCareerPositions();
  const partners = aboutService.getPartners();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredMilestones = selectedCategory === 'all' 
    ? milestones 
    : milestones.filter(m => m.type === selectedCategory);

  const getIconForSocial = (platform: string) => {
    switch (platform) {
      case 'github': return <Github className="h-5 w-5" />;
      case 'twitter': return <Twitter className="h-5 w-5" />;
      case 'linkedin': return <Linkedin className="h-5 w-5" />;
      default: return <Mail className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900">
      {/* Back Button Header */}
      {onNavigate && (
        <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.button
                  onClick={() => onNavigate('landing')}
                  whileHover={{ scale: 1.05, x: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
                  title="Back to Home"
                >
                  <ArrowLeft className="w-5 h-5" />
                </motion.button>
                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('landing')}>
                  <Shield className="h-8 w-8 text-cyan-400" />
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 text-transparent bg-clip-text">
                      FuzzForge
                    </h1>
                    <p className="text-xs text-slate-400">About Us</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-block mb-6">
              <Shield className="h-20 w-20 text-cyan-400 animate-pulse" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              About{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                FuzzForge
              </span>
            </h1>
            <p className="text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
              {companyInfo.tagline}
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-slate-400">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Founded {companyInfo.founded}</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>{companyInfo.location}</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>{team.length}+ Team Members</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-slate-900/50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 rounded-lg bg-slate-800/50 backdrop-blur-sm border border-slate-700"
              >
                <div className="text-4xl mb-3">{stat.icon}</div>
                <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-sm font-medium text-cyan-400 mb-1">{stat.label}</div>
                <div className="text-xs text-slate-400">{stat.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl bg-gradient-to-br from-cyan-600/20 to-blue-600/20 p-8 backdrop-blur-sm border border-cyan-500/30"
            >
              <Target className="h-12 w-12 text-cyan-400 mb-4" />
              <h2 className="text-3xl font-bold text-white mb-4">Our Mission</h2>
              <p className="text-slate-300 leading-relaxed text-lg">
                {companyInfo.mission}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 p-8 backdrop-blur-sm border border-purple-500/30"
            >
              <Zap className="h-12 w-12 text-purple-400 mb-4" />
              <h2 className="text-3xl font-bold text-white mb-4">Our Vision</h2>
              <p className="text-slate-300 leading-relaxed text-lg">
                {companyInfo.vision}
              </p>
            </motion.div>
          </div>

          {/* Story */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 rounded-2xl bg-slate-800/50 backdrop-blur-sm p-8 border border-slate-700"
          >
            <h2 className="text-3xl font-bold text-white mb-6">Our Story</h2>
            <div className="text-slate-300 leading-relaxed space-y-4 text-lg">
              {companyInfo.description.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Company Values */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Our Values</h2>
            <p className="text-slate-300 text-lg">
              The principles that guide everything we do
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl bg-slate-800/50 backdrop-blur-sm p-6 border border-slate-700 hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/20"
              >
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{value.title}</h3>
                <p className="text-slate-300 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Meet the Team</h2>
            <p className="text-slate-300 text-lg">
              World-class engineers and security experts from top tech companies
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group rounded-xl bg-slate-800/50 backdrop-blur-sm p-6 border border-slate-700 hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/20"
              >
                <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform">
                  {member.avatar}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                <div className="text-cyan-400 font-medium mb-3">{member.role}</div>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                  {member.bio}
                </p>
                
                {/* Social Links */}
                <div className="flex space-x-3">
                  {Object.entries(member.social).map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
                    >
                      {getIconForSocial(platform)}
                    </a>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Our Journey</h2>
            <p className="text-slate-300 text-lg mb-8">
              From idea to industry leader
            </p>
            
            {/* Filter Buttons */}
            <div className="flex flex-wrap justify-center gap-3">
              {['all', 'launch', 'funding', 'product', 'team', 'achievement'].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </motion.div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-cyan-500 to-blue-500" />

            {/* Timeline Events */}
            <div className="space-y-12">
              {filteredMilestones.map((milestone, index) => (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center ${
                    index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                  }`}
                >
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8'}`}>
                    <div className="inline-block rounded-xl bg-slate-800/50 backdrop-blur-sm p-6 border border-slate-700">
                      <div className="text-cyan-400 font-semibold mb-2">{milestone.date}</div>
                      <h3 className="text-xl font-bold text-white mb-2">{milestone.title}</h3>
                      <p className="text-slate-300">{milestone.description}</p>
                    </div>
                  </div>
                  
                  {/* Timeline Dot */}
                  <div className="relative z-10 w-6 h-6 rounded-full bg-cyan-500 border-4 border-slate-900 shadow-lg shadow-cyan-500/50" />
                  
                  <div className="w-1/2" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Press & Media */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Award className="h-16 w-16 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-4xl font-bold text-white mb-4">Press & Media</h2>
            <p className="text-slate-300 text-lg">
              See what people are saying about us
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {press.map((article, index) => (
              <motion.a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group rounded-xl bg-slate-800/50 backdrop-blur-sm p-6 border border-slate-700 hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/20"
              >
                <div className="text-cyan-400 font-bold mb-2">{article.outlet}</div>
                <div className="text-sm text-slate-400 mb-3">{article.date}</div>
                <h3 className="text-lg font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                  {article.title}
                </h3>
                <p className="text-slate-300 text-sm mb-4">{article.excerpt}</p>
                <div className="flex items-center text-cyan-400 font-medium">
                  <span>Read article</span>
                  <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-16 px-4 bg-slate-900/50">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Trusted By</h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {partners.map((partner, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex flex-col items-center justify-center p-6 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
              >
                <div className="text-3xl mb-2">{partner.logo}</div>
                <div className="text-xs text-slate-400">{partner.category}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Careers CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 p-12 text-center"
          >
            <Briefcase className="h-16 w-16 text-white mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-white mb-4">Join Our Team</h2>
            <p className="text-cyan-100 text-lg mb-8 max-w-2xl mx-auto">
              We're hiring talented engineers, researchers, and designers to help us build the future of security.
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {careers.map((position, index) => (
                <motion.div
                  key={position.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-lg bg-white/10 backdrop-blur-sm p-4 text-left"
                >
                  <h3 className="font-bold text-white mb-2">{position.title}</h3>
                  <div className="text-sm text-cyan-100 mb-1">{position.department}</div>
                  <div className="text-xs text-cyan-200">{position.location}</div>
                </motion.div>
              ))}
            </div>

            <button className="px-8 py-4 bg-white text-cyan-600 rounded-lg font-bold text-lg hover:bg-cyan-50 transition-colors inline-flex items-center space-x-2">
              <span>View All Positions</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">Get in Touch</h2>
            <p className="text-slate-300 text-lg mb-8">
              Have questions? Want to partner? We'd love to hear from you.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="mailto:hello@fuzzforge.dev"
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition-colors inline-flex items-center space-x-2"
              >
                <Mail className="h-5 w-5" />
                <span>hello@fuzzforge.dev</span>
              </a>
              <a
                href="https://twitter.com/fuzzforge"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors inline-flex items-center space-x-2"
              >
                <Twitter className="h-5 w-5" />
                <span>@fuzzforge</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
