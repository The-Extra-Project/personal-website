'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(value);

/**
 * The access request for the company surface. Same endpoint as the platform's
 * form, but built from the light design system rather than the dark instrument
 * one — a dark island in a light page was one of the flagged defects.
 */
export const AccessForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please enter your name.');
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setStatus('submitting');
    try {
      const response = await fetch('/api/waiting-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          organization: organization.trim(),
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(typeof body.error === 'string' ? body.error : 'Something went wrong.');
      }

      setStatus('success');
      setName('');
      setEmail('');
      setOrganization('');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong.');
    }
  };

  if (status === 'success') {
    return (
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-6">
        <p className="font-display text-lg font-semibold text-foreground">You are on the list.</p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          We will email you as soon as your region opens up.
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="access-name">Full name</Label>
        <Input
          required
          id="access-name"
          name="name"
          autoComplete="name"
          placeholder="Jane Doe"
          value={name}
          onChange={event => setName(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="access-email">Work email</Label>
        <Input
          required
          id="access-email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="jane@acme.com"
          value={email}
          onChange={event => setEmail(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="access-org">Organization (optional)</Label>
        <Input
          id="access-org"
          name="organization"
          autoComplete="organization"
          placeholder="Acme Corp"
          value={organization}
          onChange={event => setOrganization(event.target.value)}
        />
      </div>

      {errorMessage && (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      )}

      <Button className="w-full" disabled={status === 'submitting'} size="lg" type="submit">
        {status === 'submitting' ? 'Sending…' : 'Request access'}
      </Button>
    </form>
  );
};
