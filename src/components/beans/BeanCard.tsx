import { Link } from 'react-router-dom';
import type { BeanCard as BeanCardModel } from '../../features/beans/bean.search';
import {
  formatPrice,
  formatPricePer100g,
  formatWeight,
} from '../../utils/price-format';
import { TasteScore } from './TasteScore';

type BeanCardProps = {
  bean: BeanCardModel;
  compact?: boolean;
  compareSelected?: boolean;
  compareDisabled?: boolean;
  onCompare?: (beanId: string) => void;
  onOutboundClick?: (bean: BeanCardModel) => void;
};

export function BeanCard({
  bean,
  compact = false,
  compareSelected = false,
  compareDisabled = false,
  onCompare,
  onOutboundClick,
}: BeanCardProps) {
  const originLabel = [bean.origin.country, bean.origin.region]
    .filter(Boolean)
    .join(' / ');

  function handleOutboundClick() {
    onOutboundClick?.(bean);
  }

  return (
    <article className={compact ? 'bean-card bean-card--compact' : 'bean-card'}>
      <Link className="bean-card__link" to={`/beans/${bean.slug}`}>
        <div className="bean-card__image">
          {bean.image_url ? (
            <img
              src={bean.image_url}
              alt={bean.image_alt ?? `${bean.roastery.name} ${bean.name}`}
            />
          ) : (
            <span>{bean.roastery.name}</span>
          )}
        </div>
        <div className="bean-card__body">
          <div className="bean-card__title-row">
            <p className="bean-card__roastery">{bean.roastery.name}</p>
            {!bean.is_available && (
              <span className="badge badge--muted">품절</span>
            )}
            {bean.is_decaf && <span className="badge">디카페인</span>}
          </div>
          <h3>{bean.name}</h3>
          <p className="bean-card__meta">{originLabel || '원산지 정보 없음'}</p>
          <p className="bean-card__meta">{bean.roast_level.label}</p>
          <p className="bean-card__price">
            {formatPrice(bean.price)} · {formatWeight(bean.weight_g)}
          </p>
          <p className="bean-card__unit-price">
            {formatPricePer100g(bean.price_per_100g)}
          </p>
          <TasteScore
            compact
            items={[
              {
                key: 'acidity',
                label: '산미',
                score: bean.taste_summary.acidity.score,
                scoreLabel: bean.taste_summary.acidity.label,
              },
              {
                key: 'body',
                label: '바디감',
                score: bean.taste_summary.body.score,
                scoreLabel: bean.taste_summary.body.label,
              },
            ]}
          />
          <TagList
            label="컵노트"
            values={bean.tasting_notes.map((note) => note.label)}
          />
          <TagList
            label="추천 추출"
            values={bean.recommended_brew_methods.map((method) => method.label)}
          />
        </div>
      </Link>
      <div className="bean-card__actions">
        <button
          type="button"
          disabled={compareDisabled && !compareSelected}
          aria-pressed={compareSelected}
          onClick={() => onCompare?.(bean.id)}
        >
          {compareSelected ? '비교함 제거' : '비교함 추가'}
        </button>
        {bean.is_available ? (
          <a
            className="button-link button-link--secondary"
            href={bean.product_url}
            target="_blank"
            rel="noreferrer"
            onClick={handleOutboundClick}
          >
            판매처 이동
          </a>
        ) : (
          <button type="button" disabled>
            판매처 이동
          </button>
        )}
      </div>
    </article>
  );
}

function TagList({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) {
    return null;
  }

  return (
    <div className="tag-list" aria-label={label}>
      {values.map((value) => (
        <span key={value}>{value}</span>
      ))}
    </div>
  );
}
