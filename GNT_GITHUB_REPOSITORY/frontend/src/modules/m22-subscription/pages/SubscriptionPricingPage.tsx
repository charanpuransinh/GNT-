import React, { useEffect, useState } from 'react';
import { subscriptionService } from '../services/subscription.service';
import { SubscriptionPlan, CompanySubscription } from '../services/subscription.types';

/**
 * M22 — Subscription pricing page (ROUGH).
 * plans दिखाता है + subscribe/cancel करता है। trust-first: block नहीं, सिर्फ़ दिखाता है।
 */
export default function SubscriptionPricingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [active, setActive] = useState<CompanySubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      setError(null);
      const [p, a] = await Promise.all([subscriptionService.listPlans(), subscriptionService.getActive()]);
      setPlans(p);
      setActive(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const onSubscribe = async (planId: string) => {
    setBusy(true);
    try {
      await subscriptionService.subscribe(planId);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onCancel = async () => {
    setBusy(true);
    try {
      await subscriptionService.cancel();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div>प्लान लोड हो रहे हैं…</div>;
  if (error) return <div role="alert">गड़बड़ी: {error}</div>;

  return (
    <div>
      <h1>सब्सक्रिप्शन / प्लान</h1>
      {active && active.status === 'ACTIVE' && (
        <section>
          <p>
            मौजूदा प्लान: <strong>{active.plan?.name ?? active.planId}</strong> ({active.status})
          </p>
          <button disabled={busy} onClick={onCancel}>सदस्यता रद्द करें</button>
        </section>
      )}

      <section style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {plans.map((p) => (
          <article key={p.id} style={{ border: '1px solid #ccc', padding: '1rem', minWidth: '220px' }}>
            <h2>{p.name}</h2>
            <p>{p.description}</p>
            <p>
              ₹{p.priceMonthly}/महीना · ₹{p.priceYearly}/साल
            </p>
            <ul>
              {(p.features ?? []).map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <button
              disabled={busy || (active?.planId === p.id && active?.status === 'ACTIVE')}
              onClick={() => onSubscribe(p.id)}
            >
              {active?.planId === p.id && active?.status === 'ACTIVE' ? 'मौजूदा प्लान' : 'चुनें'}
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}
