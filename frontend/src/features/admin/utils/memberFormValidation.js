/**
 * Member Form Validation & Calendar Date Helpers
 *
 * Pure functions enforcing client-side validation aligned with:
 *  - docs/API_CONTRACT.md §5.3 (POST /users: 8 mandatory + 2 optional fields)
 *  - docs/DATABASE_SCHEMA.md §2.1, §2.4, §2.7, §7.1
 *
 * Calendar math uses explicit integer arithmetic so inclusive end-date
 * calculations match Java LocalDate.plusMonths(n).minusDays(1) without
 * JavaScript timezone shifts or Date.setMonth overflow bugs.
 */

const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARS_REGEX = /^[+\d\s()-]+$/;
const DECIMAL_TWO_PLACES_REGEX = /^\d+(\.\d{1,2})?$/;

export const PASSWORD_MIN_CHARS = 12;
export const PASSWORD_MAX_UTF8_BYTES = 72;
export const ALLOWED_PAYMENT_METHODS = ['CASH', 'CARD'];

/**
 * Determine whether a year is a Gregorian leap year.
 * @param {number} year
 * @returns {boolean}
 */
export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Return the number of days in a 1-based month (1..12) for a given year.
 * @param {number} year
 * @param {number} month - 1 through 12
 * @returns {number}
 */
export function getDaysInMonth(year, month) {
  const daysPerMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return daysPerMonth[month - 1] || 0;
}

/**
 * Parse and validate an ISO calendar date string (YYYY-MM-DD).
 * @param {string} dateStr
 * @returns {{ year: number, month: number, day: number } | null}
 */
export function parseIsoDate(dateStr) {
  if (typeof dateStr !== 'string') return null;
  const match = ISO_DATE_REGEX.exec(dateStr.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12) return null;
  const maxDay = getDaysInMonth(year, month);
  if (day < 1 || day > maxDay) return null;

  return { year, month, day };
}

/**
 * Return today's local calendar date formatted as YYYY-MM-DD without UTC shifts.
 * @returns {string}
 */
export function getTodayLocalDateString() {
  const now = new Date();
  const year = String(now.getFullYear()).padStart(4, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Compute inclusive subscription end date matching Java's
 * `startDate.plusMonths(durationMonths).minusDays(1)`.
 * Pure integer calendar arithmetic — immune to local timezone / DST shifts.
 *
 * @param {string} startDateStr - YYYY-MM-DD
 * @param {number} durationMonths - Positive integer month count
 * @returns {string | null} YYYY-MM-DD or null if inputs are invalid
 */
export function calculateInclusiveEndDate(startDateStr, durationMonths) {
  const parsed = parseIsoDate(startDateStr);
  const months = Number(durationMonths);
  if (!parsed || !Number.isInteger(months) || months <= 0) {
    return null;
  }

  // Step 1: startDate.plusMonths(durationMonths) with end-of-month clamping
  const totalMonths = parsed.year * 12 + (parsed.month - 1) + months;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;
  const clampedDay = Math.min(parsed.day, getDaysInMonth(targetYear, targetMonth));

  // Step 2: minusDays(1) across month/year boundaries
  let endYear = targetYear;
  let endMonth = targetMonth;
  let endDay = clampedDay - 1;

  if (endDay < 1) {
    endMonth -= 1;
    if (endMonth < 1) {
      endMonth = 12;
      endYear -= 1;
    }
    endDay = getDaysInMonth(endYear, endMonth);
  }

  return `${String(endYear).padStart(4, '0')}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
}

/**
 * Measure UTF-8 byte length of a string (for BCrypt 72-byte limit).
 * @param {string} value
 * @returns {number}
 */
export function getUtf8ByteLength(value) {
  return new TextEncoder().encode(value || '').length;
}

/**
 * Validate the unified Add Member form values.
 * @param {Object} values
 * @returns {Record<string, string>} Map of fieldName -> errorMessage
 */
export function validateMemberForm(values) {
  const errors = {};

  const fullName = (values.fullName || '').trim();
  if (!fullName) {
    errors.fullName = 'Full name is required.';
  } else if (Array.from(fullName).length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  } else if (fullName.length > 100) {
    errors.fullName = 'Full name cannot exceed 100 characters.';
  }

  const email = (values.email || '').trim();
  if (!email) {
    errors.email = 'Email address is required.';
  } else if (email.length > 150) {
    errors.email = 'Email cannot exceed 150 characters.';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  const phone = (values.phone || '').trim();
  if (!phone) {
    errors.phone = 'Phone number is required.';
  } else if (phone.length > 20) {
    errors.phone = 'Phone number cannot exceed 20 characters.';
  } else if (!PHONE_CHARS_REGEX.test(phone) || !/\d/.test(phone)) {
    errors.phone = 'Enter a valid phone number.';
  }

  const password = values.password || '';
  const charCount = Array.from(password).length;
  const byteLength = getUtf8ByteLength(password);
  if (!password) {
    errors.password = 'Initial password is required.';
  } else if (charCount < PASSWORD_MIN_CHARS) {
    errors.password = `Password must be at least ${PASSWORD_MIN_CHARS} characters.`;
  } else if (byteLength > PASSWORD_MAX_UTF8_BYTES) {
    errors.password = `Password cannot exceed ${PASSWORD_MAX_UTF8_BYTES} UTF-8 bytes.`;
  }

  const planId = Number(values.planId);
  if (!values.planId || !Number.isInteger(planId) || planId <= 0) {
    errors.planId = 'Select an active membership plan.';
  }

  if (!values.startDate) {
    errors.startDate = 'Subscription start date is required.';
  } else if (!parseIsoDate(values.startDate)) {
    errors.startDate = 'Enter a valid start date (YYYY-MM-DD).';
  }

  const rawAmount = values.amount === null || values.amount === undefined
    ? ''
    : String(values.amount).trim();
  if (rawAmount === '') {
    errors.amount = 'Payment amount is required.';
  } else {
    const parsedAmount = Number(rawAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      errors.amount = 'Amount must be a non-negative number.';
    } else if (!DECIMAL_TWO_PLACES_REGEX.test(rawAmount)) {
      errors.amount = 'Amount can have at most two decimal places.';
    }
  }

  if (!values.paymentDate) {
    errors.paymentDate = 'Payment date is required.';
  } else if (!parseIsoDate(values.paymentDate)) {
    errors.paymentDate = 'Enter a valid payment date (YYYY-MM-DD).';
  }

  const method = values.paymentMethod || 'CASH';
  if (!ALLOWED_PAYMENT_METHODS.includes(method)) {
    errors.paymentMethod = 'Payment method must be CASH or CARD.';
  }

  const receipt = (values.receiptNumber || '').trim();
  if (receipt.length > 50) {
    errors.receiptNumber = 'Receipt number cannot exceed 50 characters.';
  }

  return errors;
}

/**
 * Transform raw form values into the exact POST /users JSON payload.
 * Trims strings and normalizes blank receiptNumber to null per API_CONTRACT §2.2.
 * Password is intentionally NOT trimmed.
 *
 * @param {Object} values
 * @returns {Object}
 */
export function buildCreateMemberPayload(values) {
  const trimmedReceipt = (values.receiptNumber || '').trim();
  const numericAmount = Number(Number(values.amount).toFixed(2));

  return {
    fullName: (values.fullName || '').trim(),
    email: (values.email || '').trim(),
    phone: (values.phone || '').trim(),
    password: values.password || '',
    planId: Number(values.planId),
    startDate: (values.startDate || '').trim(),
    amount: numericAmount,
    paymentDate: (values.paymentDate || '').trim(),
    paymentMethod: values.paymentMethod || 'CASH',
    receiptNumber: trimmedReceipt === '' ? null : trimmedReceipt,
  };
}
