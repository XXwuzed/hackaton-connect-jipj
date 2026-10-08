import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/auth-context';
import { Brand, ConnectionArt, Icon } from '@club/ui';
import { authMessages as copy } from '../../../messages/auth';

/** Presenta el formulario de acceso al panel interno. */
export default function Login(): JSX.Element {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  if (user)
    return (
      <Navigate
        to={user.mustChangePassword ? '/change-password' : '/'}
        replace
      />
    );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const current = await login(email, password);
      navigate(current.mustChangePassword ? '/change-password' : '/', {
        replace: true,
      });
    } catch {
      setError(copy.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-layout">
      <section className="login-story" aria-labelledby="story-title">
        <Brand light />
        <div className="login-story-content">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id="story-title">
            {copy.storyTitle}
            <br />
            <span>{copy.storyAccent}</span>
          </h2>
          <p>{copy.storyDescription}</p>
          <ConnectionArt />
        </div>
        <p className="login-story-footer">
          <Icon name="heart" />
          {copy.storyFooter}
        </p>
      </section>
      <section className="login-form-side" aria-labelledby="login-title">
        <div className="login-mobile-brand">
          <Brand />
        </div>
        <div className="login-form-card">
          <span className="icon-tile">
            <Icon name="lock" />
          </span>
          <p className="login-team">{copy.team}</p>
          <h1 id="login-title">{copy.loginTitle}</h1>
          <p className="login-description">{copy.loginDescription}</p>
          <form
            onSubmit={(event) => void submit(event)}
            className="form-stack"
            aria-busy={busy}
          >
            <label className="field">
              {copy.email}
              <span className="input-with-icon">
                <Icon name="mail" />
                <input
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder={copy.emailPlaceholder}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </span>
            </label>
            <div className="field">
              <label htmlFor="login-password">{copy.password}</label>
              <div className="input-with-icon">
                <Icon name="lock" />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder={copy.passwordPlaceholder}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  className="icon-button"
                  type="button"
                  aria-label={
                    showPassword ? copy.hidePassword : copy.showPassword
                  }
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} />
                </button>
              </div>
            </div>
            {error && <p role="alert">{error}</p>}
            <button
              className="button button--primary button--full"
              type="submit"
              disabled={busy}
            >
              {busy ? copy.busy : copy.submit}
              <Icon name="arrow" />
            </button>
          </form>
          <div className="login-help">
            <strong>{copy.helpTitle}</strong>
            <p>{copy.helpDescription}</p>
          </div>
          <p className="quiet-note">
            <Icon name="shield" />
            {copy.sessionNote}
          </p>
        </div>
        <footer className="login-footer">{copy.footer}</footer>
      </section>
    </main>
  );
}
