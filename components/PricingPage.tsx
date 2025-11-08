import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Zap, HelpCircle, CreditCard, Building, Users, ArrowLeft, Shield } from 'lucide-react';
import { pricingService, PricingTier, PricingFAQ } from '../services/pricingService';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
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
                  <Shield className="h-8 w-8 text-blue-400" />
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                      FuzzForge
                    </h1>
                    <p className="text-xs text-slate-400">Pricing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-20 pb-12 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Simple, Transparent{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Pricing
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Choose the plan that fits your needs. All plans include our core security features.
            </p>
          </motion.div>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="inline-flex items-center space-x-4 rounded-full bg-slate-800 p-2"
          >
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annually')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingPeriod === 'annually'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Annually
              <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                Save 20%
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {tiers.map((tier, index) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative rounded-2xl backdrop-blur-sm border-2 overflow-hidden ${
                  tier.highlight
                    ? 'border-blue-500 bg-gradient-to-br from-blue-600/20 to-purple-600/20 shadow-2xl shadow-blue-500/20 scale-105'
                    : 'border-slate-700 bg-slate-800/50'
                }`}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                    MOST POPULAR
                  </div>
                )}

                <div className="p-8">
                  {/* Tier Header */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                    <p className="text-slate-400 text-sm">{tier.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-bold text-white">${tier.price}</span>
                      {tier.price > 0 && (
                        <span className="ml-2 text-slate-400">
                          /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
                        </span>
                      )}
                    </div>
                    {tier.savings && (
                      <div className="mt-2 text-sm text-green-400 font-medium">
                        {tier.savings} with annual billing
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all mb-8 ${
                      tier.highlight
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105'
                        : 'bg-slate-700 text-white hover:bg-slate-600'
                    }`}
                  >
                    {tier.cta}
                  </button>

                  {/* Features List */}
                  <div className="space-y-4">
                    {tier.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-start space-x-3"
                      >
                        {feature.included ? (
                          <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-5 w-5 text-slate-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className={`text-sm ${feature.included ? 'text-white' : 'text-slate-500'}`}>
                            <span className="font-medium">{feature.name}</span>
                            {feature.value && (
                              <span className="ml-2 text-blue-400">({feature.value})</span>
                            )}
                          </div>
                          {feature.tooltip && (
                            <div className="text-xs text-slate-400 mt-1">
                              {feature.tooltip}
                            </div>
                          )}
                        </div>
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
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-12 text-center"
          >
            <Building className="h-16 w-16 text-white mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Need a Custom Enterprise Plan?
            </h2>
            <p className="text-blue-100 mb-8 text-lg">
              Get custom pricing, dedicated support, on-premise deployment, and more.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Contact Sales</span>
              </button>
              <button className="px-8 py-3 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors">
                Schedule Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Compare All Features
            </h2>
            <p className="text-slate-300 text-lg">
              See exactly what's included in each plan
            </p>
          </motion.div>

          <div className="max-w-6xl mx-auto bg-slate-800/50 rounded-2xl p-8 backdrop-blur-sm overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-4 px-4 text-white font-semibold">Feature</th>
                  <th className="text-center py-4 px-4 text-white font-semibold">Free</th>
                  <th className="text-center py-4 px-4 text-white font-semibold">Pro</th>
                  <th className="text-center py-4 px-4 text-white font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {pricingService.getFeatureComparison().map((feature, index) => {
                  const freeTier = tiers.find(t => t.id === 'free');
                  const proTier = tiers.find(t => t.id === 'pro');
                  const enterpriseTier = tiers.find(t => t.id === 'enterprise');
                  
                  const freeFeature = freeTier?.features.find(f => f.name === feature);
                  const proFeature = proTier?.features.find(f => f.name === feature);
                  const enterpriseFeature = enterpriseTier?.features.find(f => f.name === feature);

                  return (
                    <tr key={index} className="border-b border-slate-700/50">
                      <td className="py-4 px-4 text-slate-300">{feature}</td>
                      <td className="py-4 px-4 text-center">
                        {freeFeature?.included ? (
                          freeFeature.value ? (
                            <span className="text-blue-400">{freeFeature.value}</span>
                          ) : (
                            <Check className="h-5 w-5 text-green-400 mx-auto" />
                          )
                        ) : (
                          <X className="h-5 w-5 text-slate-600 mx-auto" />
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {proFeature?.included ? (
                          proFeature.value ? (
                            <span className="text-blue-400">{proFeature.value}</span>
                          ) : (
                            <Check className="h-5 w-5 text-green-400 mx-auto" />
                          )
                        ) : (
                          <X className="h-5 w-5 text-slate-600 mx-auto" />
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {enterpriseFeature?.included ? (
                          enterpriseFeature.value ? (
                            <span className="text-blue-400">{enterpriseFeature.value}</span>
                          ) : (
                            <Check className="h-5 w-5 text-green-400 mx-auto" />
                          )
                        ) : (
                          <X className="h-5 w-5 text-slate-600 mx-auto" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <HelpCircle className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h2 className="text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-300 text-lg">
              Everything you need to know about pricing and plans
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="rounded-lg bg-slate-800/50 backdrop-blur-sm border border-slate-700 overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(faq.question)}
                  className="w-full flex items-start justify-between p-6 text-left hover:bg-slate-700/30 transition-colors"
                >
                  <span className="font-semibold text-white pr-8">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: expandedFAQ === faq.question ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Zap className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {expandedFAQ === faq.question && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-slate-300 leading-relaxed">
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

      {/* Trust Section */}
      <section className="py-16 px-4 bg-slate-900/50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <CreditCard className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Secure Payments</h3>
              <p className="text-slate-300">
                All payments processed securely through Stripe. PCI DSS compliant.
              </p>
            </div>
            <div className="p-6">
              <Check className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">30-Day Guarantee</h3>
              <p className="text-slate-300">
                Not satisfied? Get a full refund within 30 days, no questions asked.
              </p>
            </div>
            <div className="p-6">
              <Users className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Cancel Anytime</h3>
              <p className="text-slate-300">
                No long-term contracts. Cancel your subscription anytime with one click.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
