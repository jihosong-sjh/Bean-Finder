import type { Score } from '../../features/beans/bean.types';
import type { CSSProperties } from 'react';

export type TasteScoreItem = {
  key: string;
  label: string;
  score: Score | null;
  scoreLabel: string | null;
};

type TasteScoreProps = {
  items: TasteScoreItem[];
  compact?: boolean;
};

export function TasteScore({ items, compact = false }: TasteScoreProps) {
  return (
    <dl
      className={compact ? 'taste-score taste-score--compact' : 'taste-score'}
    >
      {items.map((item) => (
        <div className="taste-score__item" key={item.key}>
          <dt>{item.label}</dt>
          <dd>
            <span
              className="taste-score__bar"
              aria-hidden="true"
              style={{ '--score': item.score ?? 0 } as CSSProperties}
            >
              <span />
            </span>
            <span className="taste-score__value">
              {item.score === null
                ? '정보 없음'
                : `${item.score}/5 ${item.scoreLabel ?? ''}`.trim()}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
