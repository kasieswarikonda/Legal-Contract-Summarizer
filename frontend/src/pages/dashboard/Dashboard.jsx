import React from 'react';
import useAuth from '../../hooks/useAuth';

export default function Dashboard(){
  const {user} = useAuth();
  return (
    <main className="dashboard"><p className="eyebrow">Your workspace</p><h1>Welcome, {user.name}</h1><p className="muted">Your account is successfully authenticated.</p><p className="muted">You are now ready to use the Legal Contract Summarizer.</p><section className="module-placeholder"><h2>Contract Analysis</h2><p>Coming in Module 2.</p></section></main>
  )
}
