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
export declare class PricingService {
    private static instance;
    private constructor();
    static getInstance(): PricingService;
    getPricingTiers(): PricingTier[];
    getAnnualPricing(): PricingTier[];
    getFAQ(): PricingFAQ[];
    getFeatureComparison(): string[];
    calculatePrice(tierId: string, seats?: number, billingPeriod?: 'monthly' | 'annually'): number;
}
export declare const pricingService: PricingService;
//# sourceMappingURL=pricingService.d.ts.map