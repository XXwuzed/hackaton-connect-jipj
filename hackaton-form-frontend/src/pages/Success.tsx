import { Icon } from '@club/ui';
import { PublicLayout } from '../components/PublicLayout';
import { publicMessages } from '../messages/public';

/** Confirma la inscripción y explica el siguiente paso en tienda. */
export default function Success(): JSX.Element {
  const copy = publicMessages.success;
  return (
    <PublicLayout>
      <main id="main-content" className="confirmation-layout">
        <section className="confirmation-card">
          <span className="icon-tile">
            <Icon name="check" />
          </span>
          <h1>{copy.title}</h1>
          <p role="status">{copy.description}</p>
          <div className="next-step">
            <Icon name="gift" />
            <div>
              <strong>{copy.nextTitle}</strong>
              <p>{copy.nextDescription}</p>
            </div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
