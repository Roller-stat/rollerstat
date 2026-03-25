'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export function AccountDeleteRequestForm() {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [state, setState] = useState<SubmitState>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setState('error');
      setMessage('Please enter the account email.');
      return;
    }

    setState('submitting');
    setMessage('');

    try {
      const response = await fetch('/api/account-deletion-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          reason: reason.trim(),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setState('error');
        setMessage(payload?.error || 'Failed to submit request.');
        return;
      }

      setState('success');
      setMessage('Request received. We will process account deletion shortly.');
      setEmail('');
      setReason('');
    } catch {
      setState('error');
      setMessage('Failed to submit request.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="account-delete-email" className="text-sm font-medium">
          Account email
        </label>
        <Input
          id="account-delete-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="rounded-none"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="account-delete-reason" className="text-sm font-medium">
          Reason (optional)
        </label>
        <Textarea
          id="account-delete-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={1000}
          placeholder="Tell us what you want removed."
          className="min-h-28 rounded-none"
        />
      </div>

      <Button type="submit" disabled={state === 'submitting'} className="rounded-none">
        {state === 'submitting' ? 'Submitting...' : 'Submit Deletion Request'}
      </Button>

      {message ? (
        <p className={state === 'success' ? 'text-sm text-green-600' : 'text-sm text-destructive'}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
