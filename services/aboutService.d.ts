export interface TeamMember {
    id: string;
    name: string;
    role: string;
    bio: string;
    avatar: string;
    social: {
        github?: string;
        twitter?: string;
        linkedin?: string;
    };
}
export interface CompanyValue {
    id: string;
    title: string;
    description: string;
    icon: string;
}
export interface MilestoneEvent {
    id: string;
    date: string;
    title: string;
    description: string;
    type: 'launch' | 'funding' | 'product' | 'team' | 'achievement';
}
export interface CompanyStat {
    label: string;
    value: string;
    description: string;
    icon: string;
}
export declare class AboutService {
    private static instance;
    private constructor();
    static getInstance(): AboutService;
    getCompanyInfo(): {
        name: string;
        tagline: string;
        mission: string;
        vision: string;
        founded: string;
        location: string;
        description: string;
    };
    getTeamMembers(): TeamMember[];
    getCompanyValues(): CompanyValue[];
    getMilestones(): MilestoneEvent[];
    getStats(): CompanyStat[];
    getPressReleases(): {
        id: string;
        date: string;
        outlet: string;
        title: string;
        excerpt: string;
        url: string;
    }[];
    getCareerPositions(): {
        id: string;
        title: string;
        department: string;
        location: string;
        type: string;
        description: string;
    }[];
    getPartners(): {
        name: string;
        logo: string;
        category: string;
    }[];
}
export declare const aboutService: AboutService;
//# sourceMappingURL=aboutService.d.ts.map