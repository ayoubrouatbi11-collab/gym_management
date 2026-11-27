import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../../components/common/StatusBadge';

/**
 * MemberCreationSuccess — Confirmation panel displaying the three created
 * entities returned by POST /users (user, subscription, payment).
 *
 * @param {Object} props
 * @param {Object} props.result - Response matching API_CONTRACT §5.3
 * @param {string} [props.planName] - Display name for the assigned plan
 * @param {() => void} props.onReset - Callback to create another member
 */
export function MemberCreationSuccess({ result, planName, onReset }) {
  const { message, user, subscription, payment } = result;
  const formattedAmount = Number(payment.amount).toFixed(2);

  return (
    <section className="add-member-success" aria-live="polite">
      <div className="add-member-success__banner" role="status">
        <span className="add-member-success__icon" aria-hidden="true">✓</span>
        <div>
          <h3 className="add-member-success__title">Registration Complete</h3>
          <p className="add-member-success__message">{message}</p>
        </div>
      </div>

      <p className="add-member-success__notice">
        Provide the member with their login email (<strong>{user.email}</strong>) and the initial password you set so they can sign in immediately.
      </p>

      <div className="add-member-success__grid">
        <div className="add-member-summary-card">
          <div className="add-member-summary-card__header">
            <h4>Member Account</h4>
            <StatusBadge status={user.accountStatus} />
          </div>
          <dl className="add-member-summary-list">
            <div><dt>Member ID</dt><dd>#{user.id}</dd></div>
            <div><dt>Full Name</dt><dd>{user.fullName}</dd></div>
            <div><dt>Email</dt><dd>{user.email}</dd></div>
            <div><dt>Phone</dt><dd>{user.phone}</dd></div>
            <div><dt>Role</dt><dd>{user.role}</dd></div>
          </dl>
        </div>

        <div className="add-member-summary-card">
          <div className="add-member-summary-card__header">
            <h4>Initial Subscription</h4>
            <StatusBadge status={subscription.status} />
          </div>
          <dl className="add-member-summary-list">
            <div><dt>Subscription ID</dt><dd>#{subscription.id}</dd></div>
            <div><dt>Plan</dt><dd>{planName || `Plan #${subscription.planId}`}</dd></div>
            <div><dt>Start Date</dt><dd>{subscription.startDate}</dd></div>
            <div><dt>End Date</dt><dd>{subscription.endDate}</dd></div>
          </dl>
        </div>

        <div className="add-member-summary-card">
          <div className="add-member-summary-card__header">
            <h4>Initial Payment</h4>
            <StatusBadge status={payment.paymentStatus} />
          </div>
          <dl className="add-member-summary-list">
            <div><dt>Payment ID</dt><dd>#{payment.id}</dd></div>
            <div><dt>Amount</dt><dd>{formattedAmount}</dd></div>
            <div><dt>Method</dt><dd>{payment.paymentMethod}</dd></div>
            <div><dt>Payment Date</dt><dd>{payment.paymentDate}</dd></div>
            <div><dt>Receipt #</dt><dd>{payment.receiptNumber || '—'}</dd></div>
            <div><dt>Recorded By Admin</dt><dd>#{payment.recordedByAdminId}</dd></div>
          </dl>
        </div>
      </div>

      <div className="add-member-success__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={onReset}
        >
          Add Another Member
        </button>
        <Link to="/admin" className="btn btn--secondary">
          Back to Dashboard
        </Link>
      </div>
    </section>
  );
}

export default MemberCreationSuccess;
