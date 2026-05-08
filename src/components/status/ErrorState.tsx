type ErrorStateProps = {
  title?: string;
  message?: string;
};

export function ErrorState({
  title = '문제가 발생했습니다',
  message = '잠시 후 다시 시도해 주세요.',
}: ErrorStateProps) {
  return (
    <section className="status-panel" role="alert">
      <h2>{title}</h2>
      <p>{message}</p>
    </section>
  );
}
