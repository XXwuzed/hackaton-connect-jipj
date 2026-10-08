import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ConnectionArt, Icon, type IconName } from '@club/ui';
import { useAuth } from '../../../app/auth-context';
import { apiRequest } from '../../../lib/api-client';
import { dashboardMessages as copy } from '../../../messages/dashboard';

interface Summary {
  month: string;
  registered: number;
  unsubscribed: number;
  pointsRedeemed: number;
}
/** Presenta indicadores reales y accesos de trabajo de acuerdo con el rol. */
export default function Dashboard(): JSX.Element {
  const { user } = useAuth();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const query = useQuery({
    queryKey: ['summary', month],
    queryFn: () => apiRequest<Summary>(`/dashboard/summary?month=${month}`),
    enabled: user?.role === 'ADMIN',
  });
  const isAdmin = user?.role === 'ADMIN';
  const number = new Intl.NumberFormat('es-EC');
  const period = month
    ? new Intl.DateTimeFormat('es-EC', {
        month: 'long',
        year: 'numeric',
        timeZone: 'America/Guayaquil',
      }).format(new Date(`${month}-15T12:00:00Z`))
    : '';
  const metrics: {
    label: string;
    note: string;
    value: number | undefined;
    icon: IconName;
    tone: string;
  }[] = [
    {
      label: copy.registered,
      note: copy.registeredNote,
      value: query.data?.registered,
      icon: 'users',
      tone: '',
    },
    {
      label: copy.redeemed,
      note: copy.redeemedNote,
      value: query.data?.pointsRedeemed,
      icon: 'gift',
      tone: 'coral',
    },
    {
      label: copy.unsubscribed,
      note: copy.unsubscribedNote,
      value: query.data?.unsubscribed,
      icon: 'history',
      tone: 'yellow',
    },
  ];
  const actions: {
    label: string;
    description: string;
    to: string;
    icon: IconName;
    tone: string;
  }[] = [
    {
      label: copy.customers,
      description: copy.customersDescription,
      to: '/customers',
      icon: 'users',
      tone: '',
    },
    isAdmin
      ? {
          label: copy.catalog,
          description: copy.catalogDescription,
          to: '/catalog',
          icon: 'gift',
          tone: 'coral',
        }
      : {
          label: copy.redemption,
          description: copy.redemptionDescription,
          to: '/redemptions/new',
          icon: 'gift',
          tone: 'coral',
        },
    isAdmin
      ? {
          label: copy.rotation,
          description: copy.rotationDescription,
          to: '/rotation',
          icon: 'chart',
          tone: 'yellow',
        }
      : {
          label: copy.dice,
          description: copy.diceDescription,
          to: '/dice/new',
          icon: 'dice',
          tone: 'yellow',
        },
  ];
  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>
            {copy.greeting} {user?.firstName}
          </h1>
          <p>{isAdmin ? copy.description : copy.advisorDescription}</p>
        </div>
        {isAdmin && (
          <label className="period-filter">
            {copy.month}
            <input
              type="month"
              required
              value={month}
              onChange={(event) => {
                if (event.target.value) setMonth(event.target.value);
              }}
            />
          </label>
        )}
      </div>
      {isAdmin && (
        <>
          {query.isError && (
            <p role="alert">
              {copy.error}{' '}
              <button onClick={() => void query.refetch()}>{copy.retry}</button>
            </p>
          )}
          <div className="metric-grid" aria-busy={query.isPending}>
            {metrics.map((metric) => (
              <article
                className={`metric-card${metric.tone ? ` metric-card--${metric.tone}` : ''}`}
                key={metric.label}
              >
                <div className="metric-heading">
                  <h2>{metric.label}</h2>
                  <span
                    className={`icon-tile${metric.tone ? ` icon-tile--${metric.tone}` : ''}`}
                  >
                    <Icon name={metric.icon} />
                  </span>
                </div>
                <p className="metric-value">
                  {metric.value === undefined
                    ? '—'
                    : number.format(metric.value)}
                </p>
                <p className="metric-note">{metric.note}</p>
              </article>
            ))}
          </div>
          <p className="metrics-period" role="status">
            {query.isPending ? copy.loading : period}
          </p>
        </>
      )}
      <div className="dashboard-banner">
        <div className="dashboard-banner-copy">
          <p className="eyebrow">{copy.heroEyebrow}</p>
          <h2>
            {copy.heroTitle}
            <br />
            <span>{copy.heroAccent}</span>
          </h2>
          <p>{copy.heroDescription}</p>
          <Link className="button button--coral" to="/customers">
            {copy.heroAction}
            <Icon name="arrow" />
          </Link>
        </div>
        <ConnectionArt />
      </div>
      <div className="quick-heading">
        <h2>{copy.quickTitle}</h2>
        <p>{copy.quickDescription}</p>
      </div>
      <div className="quick-grid">
        {actions.map((action) => (
          <Link className="quick-card" to={action.to} key={action.to}>
            <span
              className={`icon-tile${action.tone ? ` icon-tile--${action.tone}` : ''}`}
            >
              <Icon name={action.icon} />
            </span>
            <Icon name="arrow" />
            <h3>{action.label}</h3>
            <p>{action.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
