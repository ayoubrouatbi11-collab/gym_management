/**
 * Admin Member Service
 *
 * Mocked service boundary for ADM-03 matching existing planService and userService
 * conventions and docs/API_CONTRACT.md §5.3 (POST /users) & §7.1 (GET /plans).
 *
 * Integration (INT-03):
 *   - Replace getActivePlans() with planService.getPlans()
 *   - Replace createMember(memberData) with userService.createUser(memberData)
 *
 * UI components import ONLY this service — never the mock data modules.
 */
import { ApiError } from '../../../services/api';
import { mockUsers } from '../mocks/adminDashboardMockData';
import {
  mockPlans,
  mockExistingReceiptNumbers,
} from '../mocks/adminMemberCreationMockData';
import {
  calculateInclusiveEndDate,
  validateMemberForm,
} from '../utils/memberFormValidation';

const MOCK_DELAY_MS = 350;

// In-memory session state (copy-on-write, never mutating imported seed arrays)
let sessionUsedEmails = mockUsers.map((u) => u.email.toLowerCase());
let sessionUsedReceipts = mockExistingReceiptNumbers.map((r) => r.toLowerCase());
let nextMockId = 100;

/**
 * Simulate async network latency and clone returned objects cleanly.
 * @template T
 * @param {() => T} producer
 * @returns {Promise<T>}
 */
function simulateRequest(producer) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(producer());
      } catch (err) {
        reject(err);
      }
    }, MOCK_DELAY_MS);
  });
}

/**
 * Retrieve active membership plans.
 * Aligned with planService.getPlans() (GET /plans returns active plans by default).
 * @returns {Promise<Array>}
 */
export async function getActivePlans() {
  // TODO (INT-03): return planService.getPlans();
  return simulateRequest(() =>
    mockPlans
      .filter((plan) => plan.isActive)
      .map((plan) => ({ ...plan }))
  );
}

/**
 * Create a member account with mandatory initial subscription and manual payment.
 * Aligned with userService.createUser(memberData) -> POST /users (201 Created).
 *
 * @param {Object} memberData - Request payload matching API_CONTRACT §5.3
 * @returns {Promise<{
 *   message: string,
 *   user: Object,
 *   subscription: Object,
 *   payment: Object
 * }>}
 * @throws {ApiError} Standardized contract error (VALIDATION_ERROR, EMAIL_ALREADY_EXISTS, RECEIPT_ALREADY_EXISTS)
 */
export async function createMember(memberData) {
  // TODO (INT-03): return userService.createUser(memberData);
  return simulateRequest(() => {
    const errors = validateMemberForm(memberData);
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      throw new ApiError(firstError, 'VALIDATION_ERROR', 400);
    }

    const normalizedEmail = memberData.email.trim().toLowerCase();
    if (sessionUsedEmails.includes(normalizedEmail)) {
      throw new ApiError(
        'Email address is already in use by another user account.',
        'EMAIL_ALREADY_EXISTS',
        409
      );
    }

    const plan = mockPlans.find((p) => p.id === Number(memberData.planId) && p.isActive);
    if (!plan) {
      throw new ApiError(
        'Selected membership plan is missing or inactive.',
        'VALIDATION_ERROR',
        400
      );
    }

    const normalizedReceipt = memberData.receiptNumber
      ? memberData.receiptNumber.trim()
      : null;

    if (
      normalizedReceipt &&
      sessionUsedReceipts.includes(normalizedReceipt.toLowerCase())
    ) {
      throw new ApiError(
        'Receipt number is already associated with another payment record.',
        'RECEIPT_ALREADY_EXISTS',
        409
      );
    }

    const endDate = calculateInclusiveEndDate(memberData.startDate, plan.durationMonths);
    if (!endDate) {
      throw new ApiError(
        'Unable to compute subscription end date from the provided start date.',
        'VALIDATION_ERROR',
        400
      );
    }

    const recordId = nextMockId++;
    sessionUsedEmails = [...sessionUsedEmails, normalizedEmail];
    if (normalizedReceipt) {
      sessionUsedReceipts = [...sessionUsedReceipts, normalizedReceipt.toLowerCase()];
    }

    return {
      message: 'Member created successfully with initial subscription and payment',
      user: {
        id: recordId,
        fullName: memberData.fullName.trim(),
        email: memberData.email.trim(),
        phone: memberData.phone.trim(),
        role: 'MEMBER',
        accountStatus: 'ACTIVE',
      },
      subscription: {
        id: recordId,
        planId: plan.id,
        startDate: memberData.startDate,
        endDate,
        status: 'ACTIVE',
      },
      payment: {
        id: recordId,
        recordedByAdminId: 1,
        amount: Number(Number(memberData.amount).toFixed(2)),
        paymentMethod: memberData.paymentMethod || 'CASH',
        paymentDate: memberData.paymentDate,
        receiptNumber: normalizedReceipt,
        paymentStatus: 'PAID',
      },
    };
  });
}
