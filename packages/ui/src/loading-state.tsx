/** Comunica la carga sin dejar la pantalla vacía ni simular datos. */
export function LoadingState({ label }: { label: string }): JSX.Element {
  return (
    <div className="loading-state" role="status">
      <span className="loading-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
