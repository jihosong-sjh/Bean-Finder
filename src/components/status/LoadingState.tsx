type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = '불러오는 중' }: LoadingStateProps) {
  return (
    <section
      className="status-panel"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </section>
  );
}
