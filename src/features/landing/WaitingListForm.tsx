'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(value);

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

  return (
    <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-950/80 p-8 shadow-2xl backdrop-blur">
      <div className="mb-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-400">{t('eyebrow')}</p>
        <h3 className="mt-2 text-2xl font-semibold text-white">{t('title')}</h3>
        <p className="mt-2 text-sm text-slate-200">{t('description')}</p>
      </div>

      {status === 'success'
        ? (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-center text-sm text-emerald-200">
              {t('success_message')}
            </div>
          )
        : (
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-slate-100 sm:col-span-1">
                {t('fields.name')}
                <input
                  required
                  name="name"
                  autoComplete="name"
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400"
                  value={name}
                  onChange={event => setName(event.target.value)}
                  placeholder={t('placeholders.name')}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-100 sm:col-span-1">
                {t('fields.email')}
                <input
                  required
                  type="email"
                  name="email"
                  autoComplete="email"
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder={t('placeholders.email')}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-100 sm:col-span-2">
                {t('fields.organization')}
                <input
                  name="organization"
                  autoComplete="organization"
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400"
                  value={organization}
                  onChange={event => setOrganization(event.target.value)}
                  placeholder={t('placeholders.organization')}
                />
              </label>
              {errorMessage && (
                <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200 sm:col-span-2">
                  {errorMessage}
                </p>
              )}
              <div className="sm:col-span-2">
                <Button type="submit" size="lg" className="w-full" disabled={status === 'submitting'}>
                  {status === 'submitting' ? t('submitting') : t('submit')}
                </Button>
              </div>
            </form>
          )}
    </div>
  );
};
