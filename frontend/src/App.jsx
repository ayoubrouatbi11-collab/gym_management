import React from 'react';

/**
 * FitSphere — Application Root Entry Point
 * Minimal initialization verification view.
 * Feature routes and layouts to be configured following documentation phase.
 */
function App() {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '80px auto',
      padding: '32px',
      background: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      textAlign: 'center'
    }}>
      <h1 style={{ color: '#2563eb', marginBottom: '12px', fontSize: '2.25rem' }}>FitSphere</h1>
      <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '24px' }}>
        Gym Management Platform — Project Environment Initialized
      </p>
      <div style={{
        padding: '16px',
        backgroundColor: '#f1f5f9',
        borderRadius: '6px',
        display: 'inline-block',
        textAlign: 'left'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Project Roles & Full-Stack Ownership:</div>
        <ul style={{ paddingLeft: '20px', color: '#334155' }}>
          <li><strong>Member 1:</strong> Visitor / Public Experience</li>
          <li><strong>Member 2:</strong> Administrator Management</li>
          <li><strong>Member 3:</strong> Member Dashboard & Bookings</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
