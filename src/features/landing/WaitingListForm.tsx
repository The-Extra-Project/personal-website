'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(value);

/**
 * The access request, in the sheet's own materials: hairline rules, raised
 * ground, mono field labels and tabular inputs, one amber primary. It is a
 * region of the closing panel, not a card nested inside one.
 */
export const WaitingListForm = () => {
  const t = useTranslations('WaitingList');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage(t('errors.name_required'));
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMessage(t('errors.email_invalid'));
      return;
    }

    setStatus('submitting');
    try {
      const response = await fetch('/api/waiting-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), organization: organization.trim() }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(typeof body.error === 'string' ? body.error : t('errors.generic'));
      }

      setStatus('success');
      setName('');
      setEmail('');
      setOrganization('');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : t('errors.generic'));
    }
  };

  if (status === 'success') {
    return (
      <div className="sv-form">
        <p className="sv-form-title">{t('title')}</p>
        <p className="sv-form-ok" role="status">
          {t('success_message')}
        </p>
      </div>
    );
  }

  return (
    <form className="sv-form" onSubmit={handleSubmit}>
      <p className="sv-form-title">{t('title')}</p>
      <p className="sv-form-desc">{t('description')}</p>

      <div className="sv-field">
        <label className="sv-label" htmlFor="wl-name">
          {t('fields.name')}
        </label>
        <input
          required
          id="wl-name"
          name="name"
          autoComplete="name"
          className="sv-input"
          value={name}
          onChange={event => setName(event.target.value)}
          placeholder={t('placeholders.name')}
        />
      </div>

      <div className="sv-field">
        <label className="sv-label" htmlFor="wl-email">
          {t('fields.email')}
        </label>
        <input
          required
          id="wl-email"
          type="email"
          name="email"
          autoComplete="email"
          className="sv-input"
          value={email}
          onChange={event => setEmail(event.target.value)}
          placeholder={t('placeholders.email')}
        />
      </div>

      <div className="sv-field">
        <label className="sv-label" htmlFor="wl-org">
          {t('fields.organization')}
        </label>
        <input
          id="wl-org"
          name="organization"
          autoComplete="organization"
          className="sv-input"
          value={organization}
          onChange={event => setOrganization(event.target.value)}
          placeholder={t('placeholders.organization')}
        />
      </div>

      {errorMessage && (
        <p className="sv-form-error" role="alert">
          {errorMessage}
        </p>
      )}

      <button className="sv-btn sv-btn-block" type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? t('submitting') : t('submit')}
      </button>
    </form>
  );
};
