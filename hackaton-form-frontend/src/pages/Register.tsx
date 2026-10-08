import { useEffect, useState, type FormEvent } from 'react';
import { isValidNationalId } from '@club/contracts';
import { ConnectionArt, Icon, type IconName } from '@club/ui';
import { getStore, registerCustomer } from '../lib/api';
import { PublicLayout } from '../components/PublicLayout';
import { publicMessages } from '../messages/public';

const copy = publicMessages.register;
const benefitIcons: IconName[] = ['sparkle', 'gift', 'heart'];

/** Inscribe desde el QR de una tienda, sin crear una cuenta del cliente. */
export default function Register(): JSX.Element {
  const storeCode = new URLSearchParams(window.location.search).get('t') ?? '';
  const [store, setStore] = useState('');
  const [storeError, setStoreError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [nationalId, setNationalId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  useEffect(() => {
    if (!storeCode) {
      return;
    }
    getStore(storeCode)
      .then((value) => setStore(`${value.name} · ${value.company}`))
      .catch(() => setStoreError(copy.storeError));
  }, [storeCode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidNationalId(nationalId)) {
      setError(copy.invalidId);
      return;
    }
    if (!consent) {
      setError(copy.missingConsent);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await registerCustomer({
        nationalId,
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        consent: true,
        storeCode,
      });
      window.location.assign('/success');
    } catch {
      setError(copy.error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <PublicLayout>
      <main id="main-content" className="registration-layout">
        <section className="registration-story" aria-labelledby="welcome-title">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 id="welcome-title">
            {copy.title}
            <br />
            <span>{copy.titleAccent}</span>
          </h1>
          <p className="story-description">{copy.description}</p>
          <div className="benefit-list">
            {copy.benefits.map((benefit, index) => (
              <div className="benefit" key={benefit.title}>
                <span
                  className={`icon-tile ${index === 1 ? 'icon-tile--coral' : index === 2 ? 'icon-tile--yellow' : ''}`}
                >
                  <Icon name={benefitIcons[index] ?? 'heart'} />
                </span>
                <div>
                  <h2>{benefit.title}</h2>
                  <p>{benefit.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="story-art">
            <ConnectionArt />
            <p className="community-note">
              <span className="community-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              {copy.community}
            </p>
          </div>
        </section>
        <section className="registration-card" aria-labelledby="register-title">
          <div className="card-intro">
            <span className="icon-tile">
              <Icon name="user" />
            </span>
            <div>
              <h2 id="register-title">{copy.formTitle}</h2>
              <p>{copy.formDescription}</p>
            </div>
          </div>
          <div
            className={`store-context${!store ? ' store-context--unavailable' : ''}`}
            role="status"
          >
            <Icon name="store" />
            <span>
              {store ||
                storeError ||
                (storeCode ? copy.storeLoading : copy.noStore)}
            </span>
          </div>
          <form
            onSubmit={(event) => void submit(event)}
            className="form-stack"
            aria-busy={busy}
          >
            <label className="field">
              {copy.nationalId}
              <input
                name="nationalId"
                inputMode="numeric"
                maxLength={10}
                minLength={10}
                placeholder={copy.nationalIdPlaceholder}
                value={nationalId}
                onChange={(event) => setNationalId(event.target.value)}
                required
              />
            </label>
            <div className="fields-row">
              <label className="field">
                {copy.firstName}
                <input
                  name="firstName"
                  autoComplete="given-name"
                  placeholder={copy.firstNamePlaceholder}
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                />
              </label>
              <label className="field">
                {copy.lastName}
                <input
                  name="lastName"
                  autoComplete="family-name"
                  placeholder={copy.lastNamePlaceholder}
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                />
              </label>
            </div>
            <label className="field">
              {copy.email}
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder={copy.emailPlaceholder}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">
                {copy.phone}
                <small>{copy.optional}</small>
              </span>
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder={copy.phonePlaceholder}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </label>
            <label className="consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                required
              />
              <span>{copy.consent}</span>
            </label>
            {error && <p role="alert">{error}</p>}
            <button
              type="submit"
              className="button button--primary button--full"
              disabled={busy || !store}
            >
              {busy ? copy.busy : copy.submit}
              <Icon name="arrow" />
            </button>
            <p className="quiet-note">
              <Icon name="shield" />
              {copy.privacy}
            </p>
            <p className="demo-note">{publicMessages.demo}</p>
          </form>
        </section>
      </main>
    </PublicLayout>
  );
}
