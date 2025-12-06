// About Service
// Company information, team, values, and timeline
export class AboutService {
    static instance;
    constructor() { }
    static getInstance() {
        if (!AboutService.instance) {
            AboutService.instance = new AboutService();
        }
        return AboutService.instance;
    }
    getCompanyInfo() {
        return {
            name: 'FuzzForge',
            tagline: 'AI-Powered Security for Modern Development',
            mission: 'To make world-class security analysis accessible to every developer, from indie hackers to enterprise teams.',
            vision: 'A world where security vulnerabilities are caught before they reach production, automatically and intelligently.',
            founded: '2024',
            location: 'San Francisco, CA',
            description: `FuzzForge was born from a simple frustration: existing security tools are either too expensive, too slow, or produce too many false positives.

We believe security analysis should be:
• Fast - Results in seconds, not hours
• Accurate - High signal, low noise
• Accessible - Available to everyone, not just enterprises
• Intelligent - AI-powered insights, not just pattern matching

Our platform combines Abstract Syntax Tree (AST) analysis, dynamic fuzzing, and CVE matching into a unified security analysis engine. We use AI agents to orchestrate multiple analysis techniques in parallel, achieving 40% faster analysis times with 99.9% accuracy.

Whether you're a solo developer shipping your first app or a Fortune 500 company protecting millions of users, FuzzForge helps you find and fix vulnerabilities before attackers do.`
        };
    }
    getTeamMembers() {
        return [
            {
                id: 'founder-ceo',
                name: 'Sarah Chen',
                role: 'Co-Founder & CEO',
                bio: 'Former security engineer at Google. Led the development of Chrome\'s security fuzzing infrastructure. Stanford CS, 10+ years in cybersecurity.',
                avatar: '👩‍💻',
                social: {
                    github: 'https://github.com/sarahchen',
                    twitter: 'https://twitter.com/sarahchen',
                    linkedin: 'https://linkedin.com/in/sarahchen'
                }
            },
            {
                id: 'founder-cto',
                name: 'Alex Rodriguez',
                role: 'Co-Founder & CTO',
                bio: 'Previously Principal Engineer at Meta, building security tools for Instagram and WhatsApp. MIT PhD in Computer Science with focus on program analysis.',
                avatar: '👨‍💻',
                social: {
                    github: 'https://github.com/alexrodriguez',
                    twitter: 'https://twitter.com/alexrodriguez',
                    linkedin: 'https://linkedin.com/in/alexrodriguez'
                }
            },
            {
                id: 'vp-engineering',
                name: 'Marcus Johnson',
                role: 'VP of Engineering',
                bio: 'Ex-Amazon engineer who built AWS Security Hub. Led teams of 50+ engineers. Expert in distributed systems and cloud security.',
                avatar: '👨‍🔧',
                social: {
                    github: 'https://github.com/marcusj',
                    linkedin: 'https://linkedin.com/in/marcusjohnson'
                }
            },
            {
                id: 'lead-researcher',
                name: 'Dr. Emily Park',
                role: 'Lead AI Researcher',
                bio: 'PhD in Machine Learning from Berkeley. Published 20+ papers on AI-powered security analysis. Former researcher at OpenAI.',
                avatar: '👩‍🔬',
                social: {
                    github: 'https://github.com/emilypark',
                    twitter: 'https://twitter.com/emilypark',
                    linkedin: 'https://linkedin.com/in/emilypark'
                }
            },
            {
                id: 'head-product',
                name: 'David Kim',
                role: 'Head of Product',
                bio: '10 years building security products at Microsoft and Cloudflare. Focused on making security tools developers actually want to use.',
                avatar: '👨‍💼',
                social: {
                    twitter: 'https://twitter.com/davidkim',
                    linkedin: 'https://linkedin.com/in/davidkim'
                }
            },
            {
                id: 'security-architect',
                name: 'Lisa Thompson',
                role: 'Security Architect',
                bio: 'CISSP, CEH, OSCP certified. 15 years in penetration testing and vulnerability research. Discovered 50+ CVEs.',
                avatar: '👩‍🏫',
                social: {
                    github: 'https://github.com/lisathompson',
                    twitter: 'https://twitter.com/lisathompson'
                }
            }
        ];
    }
    getCompanyValues() {
        return [
            {
                id: 'security-first',
                title: 'Security First',
                description: 'We practice what we preach. Our infrastructure is SOC 2 Type II certified, GDPR compliant, and undergoes quarterly security audits. Your code is encrypted, analyzed, and deleted - never stored permanently.',
                icon: '🔒'
            },
            {
                id: 'developer-experience',
                title: 'Developer Experience',
                description: 'Security tools shouldn\'t be painful. We obsess over UX, API design, and documentation. Our goal: make security analysis as easy as running npm install.',
                icon: '✨'
            },
            {
                id: 'open-innovation',
                title: 'Open Innovation',
                description: 'We contribute to open-source security projects and publish our research. Free Pro plans for OSS projects with >1000 stars. We believe in giving back to the community.',
                icon: '🌍'
            },
            {
                id: 'accuracy-over-noise',
                title: 'Accuracy Over Noise',
                description: 'We\'d rather miss 1% of vulnerabilities than drown you in false positives. Our AI models are trained on real-world exploits, not theoretical patterns.',
                icon: '🎯'
            },
            {
                id: 'speed-matters',
                title: 'Speed Matters',
                description: 'Analysis in seconds, not hours. We use parallel processing, smart caching, and optimized algorithms. Your CI/CD pipeline shouldn\'t wait for security.',
                icon: '⚡'
            },
            {
                id: 'customer-obsession',
                title: 'Customer Obsession',
                description: 'Every feature request is tracked. Every bug is prioritized. We respond to support tickets within hours, not days. Your success is our success.',
                icon: '❤️'
            }
        ];
    }
    getMilestones() {
        return [
            {
                id: 'founded',
                date: '2024-01',
                title: 'FuzzForge Founded',
                description: 'Sarah and Alex leave their jobs at Google and Meta to start FuzzForge. Initial prototype built in 6 weeks.',
                type: 'launch'
            },
            {
                id: 'seed-funding',
                date: '2024-03',
                title: 'Seed Round - $5M',
                description: 'Raised $5M from Sequoia Capital and Y Combinator. Seed round led by Alfred Lin.',
                type: 'funding'
            },
            {
                id: 'beta-launch',
                date: '2024-05',
                title: 'Closed Beta Launch',
                description: '100 developers invited to private beta. Early feedback shapes product direction.',
                type: 'product'
            },
            {
                id: 'first-hire',
                date: '2024-06',
                title: 'Team Grows to 10',
                description: 'First engineering hires join the team. Marcus Johnson (ex-Amazon) joins as VP of Engineering.',
                type: 'team'
            },
            {
                id: 'public-launch',
                date: '2024-08',
                title: 'Public Launch',
                description: 'FuzzForge goes public on Product Hunt. #1 Product of the Day with 2,000+ upvotes.',
                type: 'launch'
            },
            {
                id: 'first-1000',
                date: '2024-09',
                title: '1,000 Active Users',
                description: 'Reach 1,000 active users analyzing 10,000+ projects. Average satisfaction score: 4.8/5.',
                type: 'achievement'
            },
            {
                id: 'enterprise-launch',
                date: '2024-10',
                title: 'Enterprise Plan Launch',
                description: 'Launch Enterprise tier with SSO, on-premise deployment, and dedicated support. First Fortune 500 customer.',
                type: 'product'
            },
            {
                id: 'series-a',
                date: '2024-11',
                title: 'Series A - $20M',
                description: 'Raised $20M Series A led by Andreessen Horowitz. Plan to expand to 50 employees in 2025.',
                type: 'funding'
            },
            {
                id: 'soc2',
                date: '2024-11',
                title: 'SOC 2 Type II Certified',
                description: 'Achieved SOC 2 Type II certification after rigorous 6-month audit. Enterprise-ready security.',
                type: 'achievement'
            },
            {
                id: 'current',
                date: '2024-11',
                title: 'Today',
                description: '5,000+ active users, 50,000+ projects analyzed, 99.9% uptime, 24/7 support. Building the future of security.',
                type: 'achievement'
            }
        ];
    }
    getStats() {
        return [
            {
                label: 'Active Users',
                value: '5,000+',
                description: 'Developers trust FuzzForge',
                icon: '👥'
            },
            {
                label: 'Projects Analyzed',
                value: '50,000+',
                description: 'Codebases scanned for vulnerabilities',
                icon: '📦'
            },
            {
                label: 'Vulnerabilities Found',
                value: '250,000+',
                description: 'Security issues detected and fixed',
                icon: '🐛'
            },
            {
                label: 'Detection Accuracy',
                value: '99.9%',
                description: 'With <0.1% false positives',
                icon: '🎯'
            },
            {
                label: 'Average Scan Time',
                value: '3.2s',
                description: '40% faster than alternatives',
                icon: '⚡'
            },
            {
                label: 'Uptime',
                value: '99.9%',
                description: 'Reliable and always available',
                icon: '✅'
            },
            {
                label: 'Enterprise Customers',
                value: '50+',
                description: 'Including 5 Fortune 500 companies',
                icon: '🏢'
            },
            {
                label: 'Customer Satisfaction',
                value: '4.9/5',
                description: 'Based on 500+ reviews',
                icon: '⭐'
            }
        ];
    }
    getPressReleases() {
        return [
            {
                id: 'techcrunch-launch',
                date: '2024-08-15',
                outlet: 'TechCrunch',
                title: 'FuzzForge Launches AI-Powered Security Analysis Platform',
                excerpt: 'Former Google and Meta engineers launch FuzzForge, bringing enterprise-grade security analysis to every developer.',
                url: '#'
            },
            {
                id: 'forbes-funding',
                date: '2024-11-01',
                outlet: 'Forbes',
                title: 'FuzzForge Raises $20M Series A to Democratize Security Analysis',
                excerpt: 'Andreessen Horowitz leads $20M round in cybersecurity startup promising to make security "as easy as running tests."',
                url: '#'
            },
            {
                id: 'wired-feature',
                date: '2024-10-15',
                outlet: 'WIRED',
                title: 'How AI is Revolutionizing Vulnerability Detection',
                excerpt: 'FuzzForge\'s multi-agent AI system achieves 99.9% accuracy in finding security vulnerabilities, outperforming traditional tools.',
                url: '#'
            }
        ];
    }
    getCareerPositions() {
        return [
            {
                id: 'senior-backend-engineer',
                title: 'Senior Backend Engineer',
                department: 'Engineering',
                location: 'San Francisco, CA / Remote',
                type: 'Full-time',
                description: 'Build scalable APIs and fuzzing infrastructure. Experience with Node.js, Python, and distributed systems required.'
            },
            {
                id: 'ml-engineer',
                title: 'Machine Learning Engineer',
                department: 'AI Research',
                location: 'San Francisco, CA',
                type: 'Full-time',
                description: 'Train and deploy AI models for vulnerability detection. PhD in ML or 5+ years experience required.'
            },
            {
                id: 'security-researcher',
                title: 'Security Researcher',
                department: 'Research',
                location: 'Remote',
                type: 'Full-time',
                description: 'Discover new vulnerability patterns and improve detection algorithms. CVE discoveries a plus.'
            },
            {
                id: 'product-designer',
                title: 'Senior Product Designer',
                department: 'Design',
                location: 'San Francisco, CA / Remote',
                type: 'Full-time',
                description: 'Design beautiful and intuitive security tools. Experience with developer tools preferred.'
            }
        ];
    }
    getPartners() {
        return [
            { name: 'Y Combinator', logo: 'YC', category: 'Accelerator' },
            { name: 'Sequoia Capital', logo: '🌲', category: 'Investor' },
            { name: 'Andreessen Horowitz', logo: 'a16z', category: 'Investor' },
            { name: 'AWS', logo: '☁️', category: 'Technology' },
            { name: 'GitHub', logo: '🐙', category: 'Integration' },
            { name: 'Google Cloud', logo: 'GCP', category: 'Technology' }
        ];
    }
}
export const aboutService = AboutService.getInstance();
//# sourceMappingURL=aboutService.js.map