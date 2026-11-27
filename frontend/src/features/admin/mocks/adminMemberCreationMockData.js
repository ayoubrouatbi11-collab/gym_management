/**
 * Admin Member Creation Mock Data
 *
 * Seed plans and initial uniqueness sets aligned with docs/API_CONTRACT.md:
 *  - Plans:          API Section 7.1 (GET /plans)
 *  - Existing users: Reused from adminDashboardMockData to check email duplicates
 *  - Receipts:       Seed receipt numbers for duplicate-receipt conflict simulation
 *
 * Imported ONLY by adminMemberService.js, never by React UI components.
 */

export const mockPlans = [
  {
    id: 1,
    name: 'Standard Monthly',
    durationMonths: 1,
    price: 80.0,
    description: 'Full gym access for 1 month',
    isActive: true,
  },
  {
    id: 2,
    name: 'Quarterly Plan',
    durationMonths: 3,
    price: 210.0,
    description: '3-month membership with fitness assessment',
    isActive: true,
  },
  {
    id: 3,
    name: 'Annual Premium',
    durationMonths: 12,
    price: 750.0,
    description: '12-month unlimited gym access and priority class booking',
    isActive: true,
  },
  {
    id: 4,
    name: 'Legacy Off-Peak Plan',
    durationMonths: 1,
    price: 50.0,
    description: 'Discontinued introductory plan (inactive)',
    isActive: false,
  },
];

export const mockExistingReceiptNumbers = [
  'REC-2026-0001',
  'REC-2026-0002',
];
