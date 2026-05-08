import type { ReactNode } from 'react';

type ErrorStateProps = {
  title?: string;
  message?: string;
  children?: ReactNode;
};

export function ErrorState({
  title = '문제가 발생했습니다',
  message = '잠시 후 다시 시도해 주세요.',
  children,
}: ErrorStateProps) {
  return (
    <section className="status-panel" role="alert" aria-live="assertive">
      <h2>{title}</h2>
      <p>{message}</p>
      {children && <div className="status-panel__actions">{children}</div>}
    </section>
  );
}
