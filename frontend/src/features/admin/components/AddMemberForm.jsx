import React, { useState, useMemo, useRef } from 'react';
import {
  ALLOWED_PAYMENT_METHODS,
  PASSWORD_MAX_UTF8_BYTES,
  PASSWORD_MIN_CHARS,
  buildCreateMemberPayload,
  calculateInclusiveEndDate,
  getTodayLocalDateString,
  getUtf8ByteLength,
  validateMemberForm,
} from '../utils/memberFormValidation';

function createInitialFormValues() {
  const today = getTodayLocalDateString();
  return {
    fullName: '',
    email: '',
    phone: '',
    password: '',
    planId: '',
    startDate: today,
    amount: '',
    paymentDate: today,
    paymentMethod: 'CASH',
    receiptNumber: '',
  };
}

/**
 * AddMemberForm — Unified 3-in-1 administrative form capturing member details,
 * mandatory initial subscription, and mandatory initial manual payment.
 *
 * @param {Object} props
 * @param {Array} props.plans - Active membership plans
 * @param {boolean} props.plansLoading - True while plans are being fetched
 * @param {boolean} props.submitting - True while submission request is in flight
 * @param {string | null} props.submitError - Top-level submission error message
 * @param {Record<string, string>} [props.serverFieldErrors] - Field errors mapped from API errors
 * @param {(payload: Object, selectedPlan: Object | null) => Promise<void>} props.onSubmit
 */
export function AddMemberForm({
  plans,
  plansLoading,
  submitting,
  submitError,
  serverFieldErrors = {},
  onSubmit,
}) {
  const [values, setValues] = useState(createInitialFormValues);
  const [fieldErrors, setFieldErrors] = useState({});
  const [amountManuallyEdited, setAmountManuallyEdited] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef(null);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === Number(values.planId)) || null,
    [plans, values.planId]
  );

  const calculatedEndDate = useMemo(
    () => (selectedPlan ? calculateInclusiveEndDate(values.startDate, selectedPlan.durationMonths) : null),
    [selectedPlan, values.startDate]
  );

  const passwordChars = Array.from(values.password).length;
  const passwordBytes = getUtf8ByteLength(values.password);
  const combinedErrors = { ...serverFieldErrors, ...fieldErrors };
  const isDisabled = submitting || plansLoading || plans.length === 0;

  const updateField = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handlePlanChange = (event) => {
    const nextPlanId = event.target.value;
    const plan = plans.find((item) => item.id === Number(nextPlanId));

    setValues((prev) => ({
      ...prev,
      planId: nextPlanId,
      amount: !amountManuallyEdited && plan ? Number(plan.price).toFixed(2) : prev.amount,
    }));

    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.planId;
      if (!amountManuallyEdited && plan) {
        delete next.amount;
      }
      return next;
    });
  };

  const handleAmountChange = (event) => {
    setAmountManuallyEdited(true);
    updateField('amount', event.target.value);
  };

  const handleReset = () => {
    setValues(createInitialFormValues());
    setFieldErrors({});
    setAmountManuallyEdited(false);
    setShowPassword(false);
  };

  const focusFirstError = (errors) => {
    const firstKey = Object.keys(errors)[0];
    if (!firstKey || !formRef.current) return;
    const target = formRef.current.querySelector(`[name="${firstKey}"]`);
    if (target && typeof target.focus === 'function') {
      target.focus();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const errors = validateMemberForm(values);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      focusFirstError(errors);
      return;
    }

    const payload = buildCreateMemberPayload(values);
    await onSubmit(payload, selectedPlan);
  };

  return (
    <form
      ref={formRef}
      className="add-member-form"
      onSubmit={handleSubmit}
      noValidate
    >
      {submitError && (
        <div className="form-alert form-alert--error" role="alert">
          <span aria-hidden="true">⚠️</span>
          <span>{submitError}</span>
        </div>
      )}

      {/* Section 1: Member Information */}
      <fieldset className="form-section" disabled={submitting}>
        <legend className="form-section__legend">1. Member Information</legend>
        <p className="form-section__hint">
          Create the member account credentials. Accounts can sign in immediately once registered.
        </p>

        <div className="form-grid">
          <FormField
            id="member-fullName"
            name="fullName"
            label="Full Name"
            required
            error={combinedErrors.fullName}
          >
            <input
              id="member-fullName"
              name="fullName"
              type="text"
              value={values.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              placeholder="e.g. Ahmed Ali"
              maxLength={100}
              autoComplete="name"
              aria-required="true"
              aria-invalid={Boolean(combinedErrors.fullName)}
              aria-describedby={combinedErrors.fullName ? 'member-fullName-error' : undefined}
            />
          </FormField>

          <FormField
            id="member-email"
            name="email"
            label="Email Address"
            required
            error={combinedErrors.email}
          >
            <input
              id="member-email"
              name="email"
              type="email"
              value={values.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="e.g. ahmed@example.com"
              maxLength={150}
              autoComplete="email"
              aria-required="true"
              aria-invalid={Boolean(combinedErrors.email)}
              aria-describedby={combinedErrors.email ? 'member-email-error' : undefined}
            />
          </FormField>

          <FormField
            id="member-phone"
            name="phone"
            label="Phone Number"
            required
            error={combinedErrors.phone}
          >
            <input
              id="member-phone"
              name="phone"
              type="tel"
              value={values.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="e.g. 12345678"
              maxLength={20}
              autoComplete="tel"
              aria-required="true"
              aria-invalid={Boolean(combinedErrors.phone)}
              aria-describedby={combinedErrors.phone ? 'member-phone-error' : undefined}
            />
          </FormField>

          <FormField
            id="member-password"
            name="password"
            label="Initial Password"
            required
            error={combinedErrors.password}
            helper={`Minimum ${PASSWORD_MIN_CHARS} characters, max ${PASSWORD_MAX_UTF8_BYTES} UTF-8 bytes (${passwordChars} chars, ${passwordBytes}/${PASSWORD_MAX_UTF8_BYTES} bytes). Spaces allowed.`}
          >
            <div className="password-input-wrap">
              <input
                id="member-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={values.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="Enter a passphrase (12+ characters)"
                autoComplete="new-password"
                aria-required="true"
                aria-invalid={Boolean(combinedErrors.password)}
                aria-describedby={
                  combinedErrors.password ? 'member-password-error' : 'member-password-helper'
                }
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </FormField>
        </div>
      </fieldset>

      {/* Section 2: Initial Subscription */}
      <fieldset className="form-section" disabled={submitting}>
        <legend className="form-section__legend">2. Initial Subscription (Mandatory)</legend>
        <p className="form-section__hint">
          A member cannot be created without an active initial membership plan.
        </p>

        <div className="form-grid">
          <FormField
            id="member-planId"
            name="planId"
            label="Membership Plan"
            required
            error={combinedErrors.planId}
          >
            <select
              id="member-planId"
              name="planId"
              value={values.planId}
              onChange={handlePlanChange}
              disabled={plansLoading || plans.length === 0}
              aria-required="true"
              aria-invalid={Boolean(combinedErrors.planId)}
              aria-describedby={combinedErrors.planId ? 'member-planId-error' : undefined}
            >
              <option value="">
                {plansLoading
                  ? 'Loading active plans...'
                  : plans.length === 0
                    ? 'No active plans available'
                    : 'Select an active plan'}
              </option>
              {plans.map((plan) => {
                const unit = plan.durationMonths === 1 ? 'month' : 'months';
                return (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} — {plan.durationMonths} {unit} ({Number(plan.price).toFixed(2)})
                  </option>
                );
              })}
            </select>
          </FormField>

          <FormField
            id="member-startDate"
            name="startDate"
            label="Start Date"
            required
            error={combinedErrors.startDate}
            helper={
              calculatedEndDate
                ? `Inclusive end date: ${calculatedEndDate}`
                : 'Select a plan and start date to preview the expiration date.'
            }
          >
            <input
              id="member-startDate"
              name="startDate"
              type="date"
              value={values.startDate}
              onChange={(e) => updateField('startDate', e.target.value)}
              aria-required="true"
              aria-invalid={Boolean(combinedErrors.startDate)}
              aria-describedby={
                combinedErrors.startDate ? 'member-startDate-error' : 'member-startDate-helper'
              }
            />
          </FormField>
        </div>
      </fieldset>

      {/* Section 3: Initial Payment */}
      <fieldset className="form-section" disabled={submitting}>
        <legend className="form-section__legend">3. Initial Payment (Mandatory)</legend>
        <p className="form-section__hint">
          Record the verified physical payment collected at the gym reception desk.
        </p>

        <div className="form-grid">
          <FormField
            id="member-amount"
            name="amount"
            label="Payment Amount"
            required
            error={combinedErrors.amount}
          >
            <input
              id="member-amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              value={values.amount}
              onChange={handleAmountChange}
              placeholder="e.g. 80.00"
              aria-required="true"
              aria-invalid={Boolean(combinedErrors.amount)}
              aria-describedby={combinedErrors.amount ? 'member-amount-error' : undefined}
            />
          </FormField>

          <FormField
            id="member-paymentDate"
            name="paymentDate"
            label="Payment Date"
            required
            error={combinedErrors.paymentDate}
          >
            <input
              id="member-paymentDate"
              name="paymentDate"
              type="date"
              value={values.paymentDate}
              onChange={(e) => updateField('paymentDate', e.target.value)}
              aria-required="true"
              aria-invalid={Boolean(combinedErrors.paymentDate)}
              aria-describedby={combinedErrors.paymentDate ? 'member-paymentDate-error' : undefined}
            />
          </FormField>

          <FormField
            id="member-paymentMethod"
            name="paymentMethod"
            label="Payment Method (Optional)"
            error={combinedErrors.paymentMethod}
            helper="Defaults to CASH when omitted."
          >
            <select
              id="member-paymentMethod"
              name="paymentMethod"
              value={values.paymentMethod}
              onChange={(e) => updateField('paymentMethod', e.target.value)}
              aria-invalid={Boolean(combinedErrors.paymentMethod)}
              aria-describedby={
                combinedErrors.paymentMethod ? 'member-paymentMethod-error' : 'member-paymentMethod-helper'
              }
            >
              {ALLOWED_PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method === 'CASH' ? 'Cash (Reception Desk)' : 'Card (Physical POS Terminal)'}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            id="member-receiptNumber"
            name="receiptNumber"
            label="Receipt Number (Optional)"
            error={combinedErrors.receiptNumber}
            helper="Optional unique paper or POS receipt reference."
          >
            <input
              id="member-receiptNumber"
              name="receiptNumber"
              type="text"
              value={values.receiptNumber}
              onChange={(e) => updateField('receiptNumber', e.target.value)}
              placeholder="e.g. REC-2026-0003"
              maxLength={50}
              aria-invalid={Boolean(combinedErrors.receiptNumber)}
              aria-describedby={
                combinedErrors.receiptNumber ? 'member-receiptNumber-error' : 'member-receiptNumber-helper'
              }
            />
          </FormField>
        </div>
      </fieldset>

      <div className="add-member-form__actions">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={handleReset}
          disabled={submitting}
        >
          Clear Form
        </button>
        <button
          type="submit"
          className="btn btn--primary"
          disabled={isDisabled}
        >
          {submitting ? 'Creating Member...' : 'Create Member & Record Payment'}
        </button>
      </div>
    </form>
  );
}

/**
 * Reusable accessible form field wrapper.
 */
function FormField({ id, label, required = false, error, helper, children }) {
  return (
    <div className={`form-field${error ? ' form-field--error' : ''}`}>
      <label className="form-field__label" htmlFor={id}>
        {label}
        {required && <span className="form-field__required" aria-hidden="true"> *</span>}
      </label>
      {children}
      {error && (
        <span id={`${id}-error`} className="form-field__error" role="alert">
          {error}
        </span>
      )}
      {!error && helper && (
        <span id={`${id}-helper`} className="form-field__helper">
          {helper}
        </span>
      )}
    </div>
  );
}

export default AddMemberForm;
