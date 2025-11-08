// Pricing Service
// Dynamic pricing plans with feature comparisons

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingPeriod: 'monthly' | 'annually';
  description: string;
  features: PricingFeature[];
  highlight?: boolean;
  popular?: boolean;
  cta: string;
  savings?: string;
}

export interface PricingFeature {
  name: string;
  included: boolean;
  value?: string | number;
  tooltip?: string;
}

export interface PricingFAQ {
  question: string;
  answer: string;
}

export class PricingService {
  private static instance: PricingService;

  private constructor() {}

  static getInstance(): PricingService {
    if (!PricingService.instance) {
      PricingService.instance = new PricingService();
    }
    return PricingService.instance;
  }

  getPricingTiers(): PricingTier[] {
    return [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'USD',
        billingPeriod: 'monthly',
        description: 'Perfect for individual developers and small projects',
        cta: 'Get Started Free',
        features: [
          {
            name: 'Scans per month',
            included: true,
            value: '10',
            tooltip: 'Upload and analyze up to 10 projects per month'
          },
          {
            name: 'File size limit',
            included: true,
            value: '10 MB',
            tooltip: 'Maximum compressed ZIP file size'
          },
          {
            name: 'AST Analysis',
            included: true,
            tooltip: 'Deep code structure analysis for vulnerabilities'
          },
          {
            name: 'Basic Fuzzing',
            included: true,
            value: '100 iterations',
            tooltip: 'Limited fuzzing iterations per scan'
          },
          {
            name: 'CVE Matching',
            included: true,
            tooltip: 'Automatic vulnerability database lookup'
          },
          {
            name: 'Languages',
            included: true,
            value: '2',
            tooltip: 'Python and JavaScript only'
          },
          {
            name: 'Report history',
            included: true,
            value: '7 days',
            tooltip: 'Access reports for 7 days'
          },
          {
            name: 'Email support',
            included: true,
            value: 'Community',
            tooltip: '48-hour response time'
          },
          {
            name: 'API access',
            included: false
          },
          {
            name: 'Priority support',
            included: false
          },
          {
            name: 'Custom rules',
            included: false
          },
          {
            name: 'Team collaboration',
            included: false
          }
        ]
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 49,
        currency: 'USD',
        billingPeriod: 'monthly',
        description: 'For professional developers and growing teams',
        highlight: true,
        popular: true,
        cta: 'Start Pro Trial',
        features: [
          {
            name: 'Scans per month',
            included: true,
            value: '100',
            tooltip: 'Upload and analyze up to 100 projects per month'
          },
          {
            name: 'File size limit',
            included: true,
            value: '50 MB',
            tooltip: 'Maximum compressed ZIP file size'
          },
          {
            name: 'AST Analysis',
            included: true,
            tooltip: 'Deep code structure analysis for vulnerabilities'
          },
          {
            name: 'Advanced Fuzzing',
            included: true,
            value: '500 iterations',
            tooltip: 'Full fuzzing capabilities with coverage tracking'
          },
          {
            name: 'CVE Matching',
            included: true,
            tooltip: 'Real-time vulnerability database updates'
          },
          {
            name: 'Languages',
            included: true,
            value: 'All 6',
            tooltip: 'Python, JavaScript, TypeScript, Java, C/C++, Go'
          },
          {
            name: 'Report history',
            included: true,
            value: '90 days',
            tooltip: 'Access reports for 90 days'
          },
          {
            name: 'Email support',
            included: true,
            value: 'Priority',
            tooltip: '24-hour response time'
          },
          {
            name: 'API access',
            included: true,
            value: '100 req/hour',
            tooltip: 'REST API with 100 requests per hour'
          },
          {
            name: 'Code Knowledge Graphs',
            included: true,
            tooltip: 'Visual attack surface mapping'
          },
          {
            name: 'Custom rules',
            included: true,
            value: '10',
            tooltip: 'Create custom security rules'
          },
          {
            name: 'Team collaboration',
            included: true,
            value: '5 seats',
            tooltip: 'Collaborate with up to 5 team members'
          },
          {
            name: 'Slack integration',
            included: true,
            tooltip: 'Get notifications in Slack'
          },
          {
            name: 'CI/CD integration',
            included: true,
            tooltip: 'GitHub Actions, GitLab CI, Jenkins'
          }
        ]
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 299,
        currency: 'USD',
        billingPeriod: 'monthly',
        description: 'For large organizations with advanced security needs',
        highlight: false,
        cta: 'Contact Sales',
        features: [
          {
            name: 'Scans per month',
            included: true,
            value: 'Unlimited',
            tooltip: 'No limits on scans'
          },
          {
            name: 'File size limit',
            included: true,
            value: '500 MB',
            tooltip: 'Analyze large enterprise codebases'
          },
          {
            name: 'AST Analysis',
            included: true,
            tooltip: 'Advanced AI-powered analysis'
          },
          {
            name: 'Enterprise Fuzzing',
            included: true,
            value: 'Unlimited',
            tooltip: 'Unlimited fuzzing with custom strategies'
          },
          {
            name: 'CVE Matching',
            included: true,
            tooltip: 'Private vulnerability database integration'
          },
          {
            name: 'Languages',
            included: true,
            value: 'All + Custom',
            tooltip: 'All languages plus custom parser support'
          },
          {
            name: 'Report history',
            included: true,
            value: 'Unlimited',
            tooltip: 'Permanent report storage'
          },
          {
            name: 'Email support',
            included: true,
            value: '24/7 Dedicated',
            tooltip: 'Dedicated support engineer'
          },
          {
            name: 'API access',
            included: true,
            value: 'Unlimited',
            tooltip: 'No rate limits'
          },
          {
            name: 'Code Knowledge Graphs',
            included: true,
            tooltip: 'Advanced graph analytics with ML'
          },
          {
            name: 'Custom rules',
            included: true,
            value: 'Unlimited',
            tooltip: 'Custom security policies and rules'
          },
          {
            name: 'Team collaboration',
            included: true,
            value: 'Unlimited',
            tooltip: 'Unlimited team members'
          },
          {
            name: 'All integrations',
            included: true,
            tooltip: 'Slack, Jira, GitHub, GitLab, Jenkins, etc.'
          },
          {
            name: 'SSO / SAML',
            included: true,
            tooltip: 'Enterprise single sign-on'
          },
          {
            name: 'On-premise deployment',
            included: true,
            tooltip: 'Deploy FuzzForge in your infrastructure'
          },
          {
            name: 'SLA guarantee',
            included: true,
            value: '99.9%',
            tooltip: 'Uptime guarantee with credits'
          },
          {
            name: 'Custom training',
            included: true,
            tooltip: 'Onboarding and training sessions'
          }
        ]
      }
    ];
  }

  getAnnualPricing(): PricingTier[] {
    const monthly = this.getPricingTiers();
    return monthly.map(tier => ({
      ...tier,
      billingPeriod: 'annually' as const,
      price: tier.price > 0 ? Math.round(tier.price * 12 * 0.8) : 0,
      savings: tier.price > 0 ? 'Save 20%' : undefined
    }));
  }

  getFAQ(): PricingFAQ[] {
    return [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and wire transfers for Enterprise plans. All payments are processed securely through Stripe.'
      },
      {
        question: 'Can I change plans later?',
        answer: 'Yes! You can upgrade or downgrade your plan at any time. When upgrading, you\'ll be charged the prorated difference immediately. When downgrading, the change takes effect at the end of your current billing period.'
      },
      {
        question: 'What happens when I exceed my scan limit?',
        answer: 'You\'ll receive a notification when you reach 80% of your monthly limit. If you exceed your limit, you can either wait until next month or upgrade to a higher plan. Enterprise customers have unlimited scans.'
      },
      {
        question: 'Is there a free trial for Pro or Enterprise?',
        answer: 'Yes! Pro plans come with a 14-day free trial (no credit card required). Enterprise trials are available on request and include a dedicated onboarding session with our team.'
      },
      {
        question: 'Do you offer refunds?',
        answer: 'We offer a 30-day money-back guarantee for all paid plans. If you\'re not satisfied, contact us within 30 days of your purchase for a full refund, no questions asked.'
      },
      {
        question: 'What\'s included in support?',
        answer: 'Free: Community support via Discord with 48-hour response time. Pro: Priority email support with 24-hour response time. Enterprise: Dedicated support engineer with 24/7 availability and 1-hour response time for critical issues.'
      },
      {
        question: 'Can I use FuzzForge for open-source projects?',
        answer: 'Yes! We offer free Pro plans for verified open-source projects with >1000 GitHub stars. Apply through our Open Source Program page.'
      },
      {
        question: 'Is my code secure?',
        answer: 'Absolutely. Your code is encrypted in transit (TLS 1.3) and at rest (AES-256). We never store your source code permanently - it\'s deleted immediately after analysis. We\'re SOC 2 Type II certified and GDPR compliant.'
      },
      {
        question: 'What languages do you support?',
        answer: 'Currently: Python, JavaScript, TypeScript, Java, C/C++, and Go. Coming soon: Rust, PHP, Ruby, Swift, and Kotlin. Enterprise customers can request custom language support.'
      },
      {
        question: 'How accurate is the vulnerability detection?',
        answer: 'FuzzForge achieves 99.9% detection accuracy with <0.1% false positive rate. Our AI-powered analysis combines multiple techniques (AST, fuzzing, CVE matching) to ensure reliability.'
      },
      {
        question: 'Can I integrate FuzzForge into my CI/CD pipeline?',
        answer: 'Yes! Pro and Enterprise plans include full API access and pre-built integrations for GitHub Actions, GitLab CI, Jenkins, CircleCI, and Travis CI. Check our documentation for setup guides.'
      },
      {
        question: 'What\'s the difference between monthly and annual billing?',
        answer: 'Annual plans save you 20% compared to monthly billing. For example, Pro costs $49/month or $470/year (equivalent to $39.17/month). You can switch between billing periods anytime.'
      }
    ];
  }

  getFeatureComparison(): string[] {
    return [
      'Scans per month',
      'File size limit',
      'AST Analysis',
      'Fuzzing capabilities',
      'CVE Matching',
      'Supported languages',
      'Report history',
      'Support level',
      'API access',
      'Code Knowledge Graphs',
      'Custom rules',
      'Team collaboration',
      'Integrations',
      'SSO / SAML',
      'On-premise deployment',
      'SLA guarantee'
    ];
  }

  calculatePrice(tierId: string, seats: number = 1, billingPeriod: 'monthly' | 'annually' = 'monthly'): number {
    const tiers = billingPeriod === 'monthly' ? this.getPricingTiers() : this.getAnnualPricing();
    const tier = tiers.find(t => t.id === tierId);
    
    if (!tier) return 0;
    if (tierId === 'free') return 0;
    if (tierId === 'enterprise') return tier.price; // Enterprise pricing is custom
    
    return tier.price + (seats > 1 ? (seats - 1) * (tier.price * 0.2) : 0);
  }
}

export const pricingService = PricingService.getInstance();
