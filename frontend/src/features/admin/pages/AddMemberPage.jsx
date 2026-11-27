import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import AddMemberForm from '../components/AddMemberForm';
import MemberCreationSuccess from '../components/MemberCreationSuccess';
import { createMember, getActivePlans } from '../services/adminMemberService';
import './AddMemberPage.css';

/**
 * AddMemberPage — Unified 3-in-1 Admin Member Registration view (/admin/members/new).
 * Coordinates fetching active membership plans and submitting unified member creation.
 */
export function AddMemberPage() {
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [serverFieldErrors, setServerFieldErrors] = useState({});
  const [createdResult, setCreatedResult] = useState(null);
  const [createdPlanName, setCreatedPlanName] = useState('');

  const isMountedRef = useRef(true);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadPlans = useCallback(async () => {
    try {
      setPlansLoading(true);
      setPlansError(null);
      const activePlans = await getActivePlans();
      if (!isMountedRef.current) return;
      setPlans(activePlans);
    } catch (err) {
      if (!isMountedRef.current) return;
      setPlansError(err.message || 'Unable to load membership plans.');
    } finally {
      if (isMountedRef.current) {
        setPlansLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleSubmit = useCallback(async (payload, selectedPlan) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      setSubmitting(true);
      setSubmitError(null);
      setServerFieldErrors({});

      const response = await createMember(payload);
      if (!isMountedRef.current) return;

      setCreatedResult(response);
      setCreatedPlanName(selectedPlan ? selectedPlan.name : '');
    } catch (err) {
      if (!isMountedRef.current) return;

      setSubmitError(err.message || 'Failed to create member.');
      if (err.code === 'EMAIL_ALREADY_EXISTS') {
        setServerFieldErrors({ email: err.message });
      } else if (err.code === 'RECEIPT_ALREADY_EXISTS') {
        setServerFieldErrors({ receiptNumber: err.message });
      }
    } finally {
      isSubmittingRef.current = false;
      if (isMountedRef.current) {
        setSubmitting(false);
      }
    }
  }, []);

  const handleResetSuccess = useCallback(() => {
    setCreatedResult(null);
    setCreatedPlanName('');
    setSubmitError(null);
    setServerFieldErrors({});
  }, []);

  return (
    <div className="add-member-page">
      <div className="add-member-page__header">
        <div>
          <Link to="/admin" className="add-member-page__back-link">
            ← Back to Dashboard
          </Link>
          <h2 className="add-member-page__title">Add New Member</h2>
          <p className="add-member-page__subtitle">
            Register a member account together with their mandatory initial subscription and verified manual payment.
          </p>
        </div>
      </div>

      {plansError && (
        <div className="form-alert form-alert--error" role="alert">
          <span aria-hidden="true">⚠️</span>
          <span className="form-alert__text">{plansError}</span>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={loadPlans}
          >
            Retry
          </button>
        </div>
      )}

      {createdResult ? (
        <MemberCreationSuccess
          result={createdResult}
          planName={createdPlanName}
          onReset={handleResetSuccess}
        />
      ) : (
        <div className="add-member-card">
          <AddMemberForm
            plans={plans}
            plansLoading={plansLoading}
            submitting={submitting}
            submitError={submitError}
            serverFieldErrors={serverFieldErrors}
            onSubmit={handleSubmit}
          />
        </div>
      )}
    </div>
  );
}

export default AddMemberPage;
