import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Zap, HelpCircle, CreditCard, Building, Users, ArrowLeft, Shield, Star, CheckCircle2 } from 'lucide-react';
import { pricingService, PricingTier } from '../services/pricingService';
import { NavHeader } from './NavHeader';

interface PricingPageProps {
  onNavigate?: (page: 'landing' | 'dashboard' | 'docs' | 'pricing' | 'about') => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('monthly');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const tiers = billingPeriod === 'monthly'
    ? pricingService.getPricingTiers()
    : pricingService.getAnnualPricing();

  const faqs = pricingService.getFAQ();

  const toggleFAQ = (question: string) => {
    setExpandedFAQ(expandedFAQ === question ? null : question);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Shared Header or Back Nav */}
      <NavHeader onNavigate={onNavigate} />

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
              <Star className="w-4 h-4 fill-blue-400" />
              <span>Simple, Transparent Pricing</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              Choose Your <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Security Arsenal
              </span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Scale your security infrastructure with plans designed for solo developers, growing teams, and large enterprises.
            </p>
          </motion.div>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="inline-flex p-1 rounded-full bg-gray-900 border border-gray-800 relative"
          >
            <div
              className={`absolute inset-y-1 rounded-full bg-gray-800 transition-all duration-300 w-[calc(50%-4px)] ${billingPeriod === 'monthly' ? 'left-1' : 'left-[calc(50%+2px)]'}`}
            ></div>
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`relative z-10 px-8 py-3 rounded-full font-semibold text-sm transition-colors ${billingPeriod === 'monthly' ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annually')}
              className={`relative z-10 px-8 py-3 rounded-full font-semibold text-sm transition-colors flex items-center gap-2 ${billingPeriod === 'annually' ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
            >
              Annually
              <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">
                -20%
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-32 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className={`relative rounded-3xl backdrop-blur-md transition-all duration-300 group ${tier.highlight
                    ? 'bg-gray-900 border-2 border-blue-500 shadow-2xl shadow-blue-900/20 z-10 scale-105'
                    : 'bg-gray-900/50 border border-gray-800 hover:border-gray-600'
                  }`}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div className="absolute -top-5 left-0 right-0 flex justify-center">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                      <Star className="w-3 h-3 fill-white" />
                      MOST POPULAR
                    </div>
                  </div>
                )}

                <div className="p-8 h-full flex flex-col">
                  {/* Tier Header */}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                    <p className="text-gray-400 text-sm">{tier.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl lg:text-5xl font-bold text-white tracking-tight">${tier.price}</span>
                      {tier.price > 0 && (
                        <span className="text-gray-500 font-medium">
                          /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
                        </span>
                      )}
                    </div>
                    {tier.savings && (
                      <p className="text-sm text-green-400 mt-2 font-medium">
                        {tier.savings}
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    className={`w-full py-4 rounded-xl font-bold transition-all mb-8 shadow-lg ${tier.highlight
                        ? 'bg-white text-black hover:bg-gray-200'
                        : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                  >
                    {tier.cta}
                  </button>

                  <div className="h-px w-full bg-gray-800 mb-8"></div>

                  {/* Features List */}
                  <div className="space-y-4 flex-1">
                    {tier.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 group/feature"
                      >
                        {feature.included ? (
                          <div className={`mt-0.5 rounded-full p-0.5 ${tier.highlight ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
                            <Check className="w-3 h-3" strokeWidth={3} />
                          </div>
                        ) : (
                          <X className="h-4 w-4 text-gray-700 mt-1" />
                        )}
                        <span className={`text-sm ${feature.included ? 'text-gray-300 group-hover/feature:text-white transition-colors' : 'text-gray-600'}`}>
                          {feature.name}
                          {feature.value && <span className="text-white font-semibold ml-1">{feature.value}</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto rounded-3xl bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/20 p-12 lg:p-16 relative overflow-hidden">

            {/* Decorative Patterns */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>

            <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">Need a custom solution?</h2>
                <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                  For large organizations requiring SSO, on-premise deployment, dedicated support managers, and custom SLAs.
                </p>
                <div className="flex gap-4">
                  <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20">
                    Contact Sales
                  </button>
                  <button className="px-6 py-3 bg-transparent border border-gray-600 hover:bg-white/5 text-white rounded-xl font-bold transition-all">
                    View API Docs
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Users, label: "Unlimited Seats" },
                  { icon: Building, label: "On-Premise" },
                  { icon: Shield, label: "Custom SLA" },
                  { icon: Zap, label: "Dedicated Support" }
                ].map((item, i) => (
                  <div key={i} className="bg-gray-900/50 p-6 rounded-xl border border-gray-700 backdrop-blur-sm">
                    <item.icon className="w-8 h-8 text-blue-400 mb-3" />
                    <h3 className="font-bold text-white">{item.label}</h3>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-gray-900/30">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-400">Everything you need to know about billing and plans.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors"
              >
                <button
                  onClick={() => toggleFAQ(faq.question)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-bold text-white text-lg pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${expandedFAQ === faq.question ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {expandedFAQ === faq.question && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-gray-400 leading-relaxed border-t border-gray-800 pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
