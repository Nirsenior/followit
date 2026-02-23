
export type InsuranceType = 'health' | 'life' | 'critical_illness' | 'pension' | 'financial' | 'elementary' | 'abroad';

export interface CommissionValues {
  scope?: string;
  ongoing?: string;
  mobility?: string;
}

export type CompanyAgreements = Partial<Record<InsuranceType, CommissionValues>>;

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  selectedCompanies: string[];
  agreements: Record<string, CompanyAgreements>;
  paymentMethod: {
    cardNumber: string;
    expiry: string;
    cvv: string;
  };
  isSetupComplete?: boolean;
}

export const INSURANCE_COMPANIES = [
  'הראל', 'מגדל', 'מנורה', 'הפניקס', 'כלל', 'איילון', 'שומרה', 'שלמה',
  'הכשרה', 'פספורטקארד', 'אלטשולר שחם', 'אינפיניטי', 'מור', 'פסגות'
];

export const INDIVIDUAL_POLICY_COMPANIES = [
  'הפניקס', 'הראל', 'כלל', 'מגדל', 'מנורה', 'איילון', 'הכשרה'
];

export const INSURANCE_TYPE_LABELS: Record<InsuranceType, string> = {
  health: 'בריאות',
  life: 'חיים',
  critical_illness: 'מחלות קשות',
  pension: 'פנסיוני',
  financial: 'פיננסי',
  elementary: 'אלמנטרי',
  abroad: 'חו״ל'
};

export const PRIVATE_SUB_POLICIES = [
  'ניתוחים בחו״ל', 'השתלות בחו״ל', 'תרופות מחוץ לסל',
  'ניתוחים משלים שב״ן עם השתתפות עצמית', 'ניתוחים משלים שב״ן ללא השתתפות עצמית',
  'ניתוחים שקל ראשון', 'ייעוץ ובדיקות בסיסי', 'ייעוץ ובדיקות מורחב',
  'אבחון מהיר', 'טיפולים בטכנולוגיות מתקדמות ואביזרים',
  'ליווי רפואי וטיפולים אגב אירוע רפואי', 'רפואה משלימה',
  'ייעוץ אונליין', 'ביקור רופא עד הבית', 'טיפולים בהתפתחות הילד',
  'מחלות קשות', 'מחלות קשות – כיסוי לסרטן', 'תאונות אישיות'
];

export interface PremiumScheduleItem {
  age: number;
  premium: number;
}

export interface Policy {
  id: string;
  type: InsuranceType;
  company: string;
  isAgentAppointmentOnly: boolean;
  monthlyCost: number; // Manual cost or fallback
  premiumSchedule?: PremiumScheduleItem[]; // From Excel
  excelColumns?: string[]; // Metadata from Excel if uploaded
  details: {
    subPolicies?: Record<string, number>;
    accumulation?: number;
    deposit?: number;
    mobility?: number;
    subType?: string;
  };
  issueDate: string;
  status: 'active' | 'inactive';
}

export type Relationship = 'spouse' | 'child' | 'other';

export interface FamilyMember {
  id: string; // T.Z or ID
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  relationship: Relationship;
  policies: Policy[];
  isPremiumSharedWithPrimary?: boolean; // For children < 18
}

export interface Customer {
  id: string; // T.Z
  firstName: string;
  lastName: string;
  dateOfBirth: string; // Mandatory for Excel-based premium
  policies: Policy[];
  familyMembers?: FamilyMember[];
  createdAt: string;
}
