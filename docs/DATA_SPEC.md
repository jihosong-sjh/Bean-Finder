# 커피 원두 검색 엔진 데이터 명세서

문서 버전: v0.1  
작성일: 2026-05-08  
제품명: Bean Finder, 가칭  
연관 문서: [PRD.md](./PRD.md), [FUNCTIONAL_SPEC.md](./FUNCTIONAL_SPEC.md), [SCREEN_SPEC.md](./SCREEN_SPEC.md)  
문서 목적: Bean Finder MVP에서 사용하는 원두, 로스터리, 맛 프로필, 컵노트, 카테고리, 랭킹, 이벤트 데이터의 구조와 검증 규칙을 정의한다.

## 1. 범위

이 문서는 MVP 구현에 필요한 데이터 모델을 정의한다.

포함 데이터:

- 원두
- 로스터리
- 가격과 용량
- 맛 프로필
- 컵노트
- 추출 방식
- 카테고리
- 랭킹
- 필터 옵션
- 검색 인덱스 대상 필드
- 이벤트 로그

제외 데이터:

- 회원 계정
- 결제 정보
- 사용자 리뷰 본문
- 사용자 찜 목록
- 개인화 추천 이력
- 자동 크롤링 작업 이력

## 2. 데이터 설계 원칙

### 2.1 검색 단위

MVP에서 검색 결과에 노출되는 기본 단위는 `원두 상품`이다.

하나의 로스터리가 같은 원두를 여러 용량으로 판매할 수 있지만, MVP에서는 대표 판매 단위 1개를 우선 등록한다. 예를 들어 200g과 500g 상품이 모두 있을 경우 운영자가 대표 상품을 선택하고, 해당 상품의 가격과 용량을 기준으로 `price_per_100g`을 계산한다.

추후 확장 시 하나의 원두에 여러 판매 옵션을 연결할 수 있도록 `primary_package` 구조를 사용한다.

### 2.2 필드 이름

- 내부 필드명은 `snake_case`를 사용한다.
- 화면 URL에 쓰이는 key는 사람이 읽을 수 있는 `kebab-case`를 사용한다.
- 날짜는 ISO 8601 형식의 문자열을 사용한다.
- 금액은 원화 기준 정수로 저장한다.

### 2.3 필수 데이터 우선

검색 결과, 상세, 비교 화면을 깨지지 않게 만들기 위해 다음 데이터는 원두 등록 시 필수로 요구한다.

- 원두명
- 로스터리
- 원산지 국가
- 로스팅 정도
- 컵노트 1개 이상
- 산미, 단맛, 쓴맛, 바디감 점수
- 추천 추출 방식 1개 이상
- 가격
- 용량
- 판매처 URL
- 판매 가능 여부
- 마지막 확인일

### 2.4 파생 데이터

다음 데이터는 직접 입력하지 않고 계산하거나 매핑한다.

| 파생 필드 | 기준 |
| --- | --- |
| price_per_100g | price / weight_g * 100 |
| easy_taste_tags | 맛 점수, 컵노트, 로스팅 기준 |
| data_completeness_score | 필수/선택 필드 입력률 |
| search_text | 검색 대상 필드를 합친 정규화 문자열 |
| category membership | 카테고리별 기본 조건 |
| ranking order | 랭킹별 기준 |

## 3. 저장 방식

MVP 구현 전까지 특정 DB를 전제하지 않는다. 논리 모델은 다음 저장 방식 중 하나로 옮길 수 있어야 한다.

추천 우선순위:

1. 개발 초기: `data/*.json`
2. 운영 데이터 300개 이상: 관계형 DB seed
3. 검색 고도화 이후: 검색 인덱스 별도 구성

권장 파일 구조:

```text
data/
  beans.json
  roasteries.json
  tasting_notes.json
  categories.json
  rankings.json
```

이 문서는 파일 생성을 요구하지 않고, 데이터 구조만 정의한다.

## 4. 엔티티 관계

```text
Roastery 1 --- N Bean
Bean      N --- N TastingNote
Bean      N --- N BrewMethod
Category 1 --- N Bean, 조건 기반 계산
Ranking  1 --- N Bean, 기준 기반 계산
```

핵심 관계:

- 원두는 반드시 하나의 로스터리에 속한다.
- 원두는 여러 컵노트를 가질 수 있다.
- 원두는 여러 추출 방식에 추천될 수 있다.
- 카테고리와 랭킹은 원두에 직접 저장하지 않고 조건으로 계산한다.

## 5. 공통 타입

### 5.1 ID

| 타입 | 형식 | 예시 |
| --- | --- | --- |
| bean_id | 문자열 | `bean_fritz_ethiopia_yirgacheffe_001` |
| roastery_id | 문자열 | `roastery_fritz` |
| tasting_note_key | 문자열 | `berry`, `chocolate`, `nutty` |
| category_key | kebab-case 문자열 | `low-acidity` |
| ranking_key | kebab-case 문자열 | `price-per-100g` |

규칙:

- ID는 생성 후 변경하지 않는다.
- 화면에 노출되는 URL에는 `slug` 또는 `id`를 사용할 수 있다.
- MVP에서는 중복 방지를 위해 `id`를 URL에 사용해도 된다.

### 5.2 날짜

| 필드 | 형식 | 예시 |
| --- | --- | --- |
| created_at | ISO 8601 | `2026-05-08T12:00:00+09:00` |
| updated_at | ISO 8601 | `2026-05-08T12:00:00+09:00` |
| last_checked_at | YYYY-MM-DD | `2026-05-08` |

### 5.3 금액

| 필드 | 타입 | 단위 |
| --- | --- | --- |
| price | integer | 원 |
| price_per_100g | integer | 원 |
| weight_g | integer | g |

규칙:

- `price`와 `weight_g`는 0보다 커야 한다.
- `price_per_100g`은 계산값을 우선한다.
- 표시 시에는 천 단위 쉼표를 적용한다.

## 6. 원두 데이터

### 6.1 엔티티명

```text
Bean
```

### 6.2 설명

사용자가 검색, 필터, 비교, 상세 조회하는 핵심 데이터다. MVP에서는 원두 자체와 대표 판매 상품을 하나의 엔티티로 관리한다.

### 6.3 필드 정의

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| id | string | 필수 | 원두 고유 ID |
| slug | string | 필수 | URL 또는 표시용 slug |
| name | string | 필수 | 원두명 |
| roastery_id | string | 필수 | 연결된 로스터리 ID |
| origin | object | 필수 | 원산지 정보 |
| variety | string 또는 null | 선택 | 품종 |
| process | string | 선택 | 가공 방식 |
| roast_level | string | 필수 | 로스팅 정도 |
| tasting_notes | array | 필수 | 컵노트 key 목록 |
| taste_profile | object | 필수 | 맛 점수 |
| easy_taste_tags | array | 파생 | 쉬운 맛 표현 tag |
| recommended_brew_methods | array | 필수 | 추천 추출 방식 |
| primary_package | object | 필수 | 대표 가격/용량/판매처 정보 |
| media | object | 선택 | 이미지 정보 |
| rating | object | 선택 | 평점과 리뷰 수 |
| flags | object | 필수 | 디카페인, 판매 상태 등 |
| source | object | 필수 | 데이터 출처 |
| created_at | string | 필수 | 데이터 생성일 |
| updated_at | string | 필수 | 데이터 수정일 |

### 6.4 origin

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| country | string | 필수 | 원산지 국가명 |
| country_code | string | 선택 | ISO 국가 코드 |
| region | string 또는 null | 선택 | 생산 지역 |
| farm | string 또는 null | 선택 | 농장 |
| producer | string 또는 null | 선택 | 생산자 |

예시:

```json
{
  "country": "Ethiopia",
  "country_code": "ET",
  "region": "Yirgacheffe",
  "farm": null,
  "producer": null
}
```

### 6.5 taste_profile

| 필드 | 타입 | 필수 | 범위 |
| --- | --- | --- | --- |
| acidity | integer | 필수 | 1-5 |
| sweetness | integer | 필수 | 1-5 |
| bitterness | integer | 필수 | 1-5 |
| body | integer | 필수 | 1-5 |
| aroma | integer 또는 null | 선택 | 1-5 |
| balance | integer 또는 null | 선택 | 1-5 |

점수 의미:

| 점수 | 의미 |
| --- | --- |
| 1 | 매우 낮음 |
| 2 | 낮음 |
| 3 | 보통 |
| 4 | 높음 |
| 5 | 매우 높음 |

### 6.6 primary_package

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| price | integer | 필수 | 판매 가격, 원 |
| weight_g | integer | 필수 | 용량, g |
| price_per_100g | integer | 파생 | 100g당 가격 |
| currency | string | 필수 | MVP는 `KRW` |
| product_url | string | 필수 | 원 판매처 URL |
| affiliate_url | string 또는 null | 선택 | 제휴 URL |
| package_label | string 또는 null | 선택 | 예: `200g`, `500g` |

계산 규칙:

```text
price_per_100g = round(price / weight_g * 100)
```

### 6.7 media

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| image_url | string 또는 null | 선택 | 대표 이미지 URL |
| image_alt | string 또는 null | 선택 | 이미지 대체 텍스트 |

규칙:

- `image_url`이 없으면 화면에서 기본 이미지를 사용한다.
- `image_alt`가 없으면 `{로스터리명} {원두명}`으로 생성한다.

### 6.8 rating

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| average | number 또는 null | 선택 | 평점 |
| count | integer 또는 null | 선택 | 리뷰 수 |
| source | string 또는 null | 선택 | 평점 출처 |

MVP에서는 평점 데이터가 없어도 원두를 등록할 수 있다.

### 6.9 flags

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| is_decaf | boolean | 필수 | 디카페인 여부 |
| is_available | boolean | 필수 | 판매 가능 여부 |
| is_blend | boolean | 선택 | 블렌드 여부 |
| is_featured | boolean | 선택 | 운영자 추천 여부 |

### 6.10 source

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| type | string | 필수 | 데이터 출처 유형 |
| name | string | 필수 | 출처명 |
| url | string 또는 null | 선택 | 출처 URL |
| last_checked_at | string | 필수 | 마지막 확인일 |
| tagged_by | string 또는 null | 선택 | 운영자 태깅 담당자 |

source.type 허용 값:

- `roastery_official`
- `marketplace`
- `operator_tagging`
- `user_feedback`

### 6.11 Bean 예시

```json
{
  "id": "bean_sample_ethiopia_yirgacheffe_001",
  "slug": "sample-ethiopia-yirgacheffe",
  "name": "에티오피아 예가체프 내추럴",
  "roastery_id": "roastery_sample",
  "origin": {
    "country": "Ethiopia",
    "country_code": "ET",
    "region": "Yirgacheffe",
    "farm": null,
    "producer": null
  },
  "variety": "Heirloom",
  "process": "natural",
  "roast_level": "light",
  "tasting_notes": ["berry", "floral", "citrus"],
  "taste_profile": {
    "acidity": 4,
    "sweetness": 4,
    "bitterness": 1,
    "body": 2,
    "aroma": 5,
    "balance": 4
  },
  "easy_taste_tags": ["산미 있음", "과일향", "꽃향", "가벼움"],
  "recommended_brew_methods": ["hand_drip", "cold_brew"],
  "primary_package": {
    "price": 18000,
    "weight_g": 200,
    "price_per_100g": 9000,
    "currency": "KRW",
    "product_url": "https://example.com/products/ethiopia-yirgacheffe",
    "affiliate_url": null,
    "package_label": "200g"
  },
  "media": {
    "image_url": null,
    "image_alt": "샘플 로스터리 에티오피아 예가체프 내추럴"
  },
  "rating": {
    "average": null,
    "count": null,
    "source": null
  },
  "flags": {
    "is_decaf": false,
    "is_available": true,
    "is_blend": false,
    "is_featured": false
  },
  "source": {
    "type": "operator_tagging",
    "name": "운영자 입력",
    "url": null,
    "last_checked_at": "2026-05-08",
    "tagged_by": null
  },
  "created_at": "2026-05-08T12:00:00+09:00",
  "updated_at": "2026-05-08T12:00:00+09:00"
}
```

## 7. 로스터리 데이터

### 7.1 엔티티명

```text
Roastery
```

### 7.2 설명

원두를 판매하는 로스터리 또는 브랜드 정보다.

### 7.3 필드 정의

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| id | string | 필수 | 로스터리 고유 ID |
| slug | string | 필수 | URL 또는 표시용 slug |
| name | string | 필수 | 로스터리명 |
| name_en | string 또는 null | 선택 | 영문명 |
| description | string 또는 null | 선택 | 소개 |
| website_url | string 또는 null | 선택 | 공식 웹사이트 |
| logo_url | string 또는 null | 선택 | 로고 이미지 |
| location | object | 선택 | 위치 정보 |
| social_links | object | 선택 | SNS 링크 |
| created_at | string | 필수 | 생성일 |
| updated_at | string | 필수 | 수정일 |

### 7.4 location

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| country | string | 선택 | 국가 |
| city | string 또는 null | 선택 | 도시 |
| address | string 또는 null | 선택 | 주소 |

### 7.5 Roastery 예시

```json
{
  "id": "roastery_sample",
  "slug": "sample-roastery",
  "name": "샘플 로스터리",
  "name_en": "Sample Roastery",
  "description": null,
  "website_url": "https://example.com",
  "logo_url": null,
  "location": {
    "country": "Korea",
    "city": "Seoul",
    "address": null
  },
  "social_links": {
    "instagram": null,
    "youtube": null
  },
  "created_at": "2026-05-08T12:00:00+09:00",
  "updated_at": "2026-05-08T12:00:00+09:00"
}
```

## 8. 컵노트 데이터

### 8.1 엔티티명

```text
TastingNote
```

### 8.2 설명

원두의 향미 표현을 검색과 필터에 사용할 수 있도록 표준화한 태그다.

### 8.3 필드 정의

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| key | string | 필수 | 내부 key |
| label_ko | string | 필수 | 한국어 표시명 |
| label_en | string | 선택 | 영어 표시명 |
| group | string | 필수 | 향미 그룹 |
| aliases | array | 선택 | 동의어 |
| easy_tag | string 또는 null | 선택 | 쉬운 표현 |

### 8.4 group 허용 값

| group | 설명 | 예시 |
| --- | --- | --- |
| fruit | 과일 계열 | citrus, apple, peach |
| berry | 베리 계열 | berry, blueberry, strawberry |
| floral | 꽃 계열 | floral, jasmine |
| nut | 견과 계열 | nutty, almond, hazelnut |
| chocolate | 초콜릿 계열 | chocolate, cacao |
| sweet | 단맛 계열 | caramel, honey, brown_sugar |
| spice | 향신료 계열 | cinnamon, clove |
| herbal | 허브 계열 | tea, herb |
| roasted | 로스티드 계열 | smoky, roasted_nut |
| other | 기타 | winey |

### 8.5 TastingNote 예시

```json
{
  "key": "berry",
  "label_ko": "베리",
  "label_en": "Berry",
  "group": "berry",
  "aliases": ["berries", "mixed_berry", "red_berry", "블루베리", "딸기"],
  "easy_tag": "과일향"
}
```

## 9. 카테고리 데이터

### 9.1 엔티티명

```text
Category
```

### 9.2 설명

사용자가 검색어를 모르더라도 취향이나 상황으로 진입할 수 있게 하는 탐색 단위다. 카테고리 원두 목록은 원두에 직접 저장하지 않고 `default_filters`로 계산한다.

### 9.3 필드 정의

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| key | string | 필수 | URL key |
| title | string | 필수 | 화면 표시명 |
| description | string | 필수 | 카테고리 설명 |
| default_filters | object | 필수 | 기본 적용 필터 |
| default_sort | string | 필수 | 기본 정렬 |
| is_active | boolean | 필수 | 노출 여부 |
| display_order | integer | 필수 | 홈 노출 순서 |

### 9.4 MVP 카테고리

| key | title | default_filters |
| --- | --- | --- |
| low-acidity | 신맛 적은 원두 | `{"acidity": "low"}` |
| bright-acidity | 산미 있는 원두 | `{"acidity": "high"}` |
| nutty | 고소한 원두 | `{"tasting_note_groups": ["nut"]}` |
| full-body | 묵직한 원두 | `{"body": "heavy"}` |
| latte | 라떼용 원두 | `{"brew_method": ["latte", "espresso"]}` |
| hand-drip | 핸드드립용 원두 | `{"brew_method": ["hand_drip"]}` |
| under-20000 | 2만원 이하 원두 | `{"price_max": 20000}` |
| value | 가성비 원두 | `{"price_per_100g_percentile": "bottom_30"}` |
| decaf | 디카페인 원두 | `{"is_decaf": true}` |

### 9.5 Category 예시

```json
{
  "key": "low-acidity",
  "title": "신맛 적은 원두",
  "description": "산미가 낮고 고소하거나 묵직한 느낌의 원두입니다.",
  "default_filters": {
    "acidity": "low"
  },
  "default_sort": "recommended",
  "is_active": true,
  "display_order": 1
}
```

## 10. 랭킹 데이터

### 10.1 엔티티명

```text
Ranking
```

### 10.2 설명

가격, 맛, 추출 방식 등 기준에 따라 원두를 정렬해 보여주는 목록 정의다. 랭킹 결과는 저장하지 않고 요청 시 계산하거나 캐시한다.

### 10.3 필드 정의

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| key | string | 필수 | URL key |
| title | string | 필수 | 화면 표시명 |
| description | string | 필수 | 랭킹 설명 |
| filters | object | 선택 | 랭킹 대상 조건 |
| sort | object | 필수 | 정렬 기준 |
| limit | integer | 필수 | 표시 개수 |
| is_active | boolean | 필수 | 노출 여부 |
| display_order | integer | 필수 | 홈 노출 순서 |

### 10.4 MVP 랭킹

| key | title | filters | sort |
| --- | --- | --- | --- |
| price-per-100g | 100g당 가격 낮은 원두 | `{"is_available": true}` | `{"field": "price_per_100g", "direction": "asc"}` |
| under-20000 | 2만원 이하 추천 원두 | `{"price_max": 20000}` | `{"field": "recommendation_score", "direction": "desc"}` |
| high-acidity | 산미 강한 원두 | `{"acidity": "high"}` | `{"field": "acidity", "direction": "desc"}` |
| low-acidity | 신맛 적은 원두 | `{"acidity": "low"}` | `{"field": "acidity", "direction": "asc"}` |
| latte | 라떼 추천 원두 | `{"brew_method": ["latte", "espresso"]}` | `{"field": "body", "direction": "desc"}` |
| hand-drip | 핸드드립 추천 원두 | `{"brew_method": ["hand_drip"]}` | `{"field": "recommendation_score", "direction": "desc"}` |
| beginner | 입문자 추천 원두 | `{"acidity_max": 3, "bitterness_max": 3, "price_max": 25000}` | `{"field": "recommendation_score", "direction": "desc"}` |

### 10.5 Ranking 예시

```json
{
  "key": "price-per-100g",
  "title": "100g당 가격 낮은 원두",
  "description": "용량 차이를 반영해 100g당 가격이 낮은 순서로 정렬한 랭킹입니다.",
  "filters": {
    "is_available": true
  },
  "sort": {
    "field": "price_per_100g",
    "direction": "asc"
  },
  "limit": 50,
  "is_active": true,
  "display_order": 1
}
```

## 11. enum 정의

### 11.1 roast_level

| 값 | 표시명 | 설명 |
| --- | --- | --- |
| light | 라이트 | 산뜻하고 산미가 잘 드러나는 로스팅 |
| medium | 미디엄 | 균형감 있는 로스팅 |
| medium_dark | 미디엄다크 | 단맛과 바디감이 강조되는 로스팅 |
| dark | 다크 | 쌉쌀함과 묵직함이 강한 로스팅 |

### 11.2 process

| 값 | 표시명 |
| --- | --- |
| washed | 워시드 |
| natural | 내추럴 |
| honey | 허니 |
| anaerobic | 무산소 발효 |
| semi_washed | 세미 워시드 |
| blend | 블렌드 |
| unknown | 정보 없음 |

### 11.3 brew_method

| 값 | 표시명 |
| --- | --- |
| hand_drip | 핸드드립 |
| espresso | 에스프레소 |
| latte | 라떼 |
| cold_brew | 콜드브루 |
| moka_pot | 모카포트 |
| french_press | 프렌치프레스 |

### 11.4 sort_key

| 값 | 기준 |
| --- | --- |
| recommended | 추천순 |
| price_asc | 가격 낮은 순 |
| price_per_100g_asc | 100g당 가격 낮은 순 |
| rating_desc | 평점 높은 순 |
| review_count_desc | 리뷰 많은 순 |
| acidity_desc | 산미 강한 순 |
| body_desc | 바디감 강한 순 |
| newest | 최신 등록순 |

## 12. 쉬운 맛 표현 매핑

`easy_taste_tags`는 다음 규칙으로 생성한다.

| 조건 | tag |
| --- | --- |
| acidity 1-2 | 신맛 적음 |
| acidity 4-5 | 산미 있음 |
| body 1-2 | 가벼움 |
| body 4-5 | 묵직함 |
| bitterness 1-2 | 쓴맛 적음 |
| sweetness 4-5 | 단맛 좋음 |
| roast_level = dark | 진하고 쌉쌀함 |
| tasting_notes group = nut | 고소함 |
| tasting_notes group = chocolate | 초콜릿 느낌 |
| tasting_notes group = berry | 베리향 |
| tasting_notes group = floral | 꽃향 |
| recommended_brew_methods에 latte 포함 | 라떼용 |
| recommended_brew_methods에 hand_drip 포함 | 핸드드립용 |

규칙:

- 중복 tag는 제거한다.
- 목록 카드에는 최대 3개까지 노출한다.
- 상세 화면에는 전체 tag를 노출할 수 있다.

## 13. 필터 데이터

필터는 데이터베이스에 반드시 저장할 필요는 없지만, API와 UI가 같은 기준을 사용해야 한다.

### 13.1 가격대 필터

| key | label | 조건 |
| --- | --- | --- |
| under_10000 | 1만원 이하 | price <= 10000 |
| 10000_20000 | 1만-2만원 | 10000 < price <= 20000 |
| 20000_30000 | 2만-3만원 | 20000 < price <= 30000 |
| over_30000 | 3만원 이상 | price > 30000 |

### 13.2 산미 필터

| key | label | 조건 |
| --- | --- | --- |
| low | 낮음 | acidity 1-2 |
| medium | 보통 | acidity 3 |
| high | 높음 | acidity 4-5 |

### 13.3 바디감 필터

| key | label | 조건 |
| --- | --- | --- |
| light | 가벼움 | body 1-2 |
| medium | 보통 | body 3 |
| heavy | 묵직함 | body 4-5 |

## 14. 검색 인덱스

### 14.1 검색 대상 필드

| 필드 | 가중치 | 설명 |
| --- | --- | --- |
| name | 높음 | 원두명 |
| roastery.name | 높음 | 로스터리명 |
| tasting_notes.label_ko | 중간 | 컵노트 한국어 |
| tasting_notes.aliases | 중간 | 컵노트 동의어 |
| easy_taste_tags | 중간 | 쉬운 맛 표현 |
| origin.country | 중간 | 원산지 국가 |
| origin.region | 낮음 | 생산 지역 |
| variety | 낮음 | 품종 |
| process | 낮음 | 가공 방식 |
| roast_level | 낮음 | 로스팅 정도 |
| recommended_brew_methods | 중간 | 추출 방식 |

### 14.2 search_text 생성

검색 인덱스가 없는 MVP에서는 다음 필드를 합쳐 `search_text`를 만들 수 있다.

```text
search_text =
name
+ roastery_name
+ origin.country
+ origin.region
+ variety
+ process
+ roast_level
+ tasting_note labels
+ tasting_note aliases
+ easy_taste_tags
+ recommended_brew_methods labels
```

규칙:

- 영문은 소문자로 정규화한다.
- 앞뒤 공백과 중복 공백을 제거한다.
- 한글 동의어는 `aliases`를 통해 보완한다.

## 15. 추천 점수와 데이터 완성도

### 15.1 recommendation_score

추천순 정렬에는 기능 명세의 공식을 사용한다.

평점과 리뷰 수가 있는 경우:

```text
recommendation_score =
taste_match_score * 0.45
+ price_fit_score * 0.20
+ data_completeness_score * 0.15
+ rating_score * 0.10
+ review_count_score * 0.10
```

평점과 리뷰 수가 없는 경우:

```text
recommendation_score =
taste_match_score * 0.55
+ price_fit_score * 0.25
+ data_completeness_score * 0.20
```

### 15.2 data_completeness_score

선택 필드 입력 정도를 점수화한다.

권장 기준:

| 항목 | 점수 |
| --- | --- |
| 지역 입력 | 10 |
| 농장 또는 생산자 입력 | 10 |
| 품종 입력 | 10 |
| 가공 방식 입력 | 10 |
| 이미지 입력 | 10 |
| 향미 강도 입력 | 10 |
| 밸런스 입력 | 10 |
| 평점 입력 | 10 |
| 리뷰 수 입력 | 10 |
| 공식 출처 URL 입력 | 10 |

총점은 0-100으로 정규화한다.

## 16. 데이터 검증 규칙

### 16.1 Bean 검증

| 규칙 | 오류 처리 |
| --- | --- |
| id가 비어 있으면 안 됨 | 등록 실패 |
| id가 중복되면 안 됨 | 등록 실패 |
| roastery_id가 존재해야 함 | 등록 실패 |
| name이 비어 있으면 안 됨 | 등록 실패 |
| origin.country가 비어 있으면 안 됨 | 등록 실패 |
| roast_level은 enum 값이어야 함 | 등록 실패 |
| tasting_notes는 1개 이상이어야 함 | 등록 실패 |
| tasting_notes key는 사전에 존재해야 함 | 등록 실패 또는 운영자 확인 |
| taste_profile 필수 점수는 1-5 정수여야 함 | 등록 실패 |
| recommended_brew_methods는 1개 이상이어야 함 | 등록 실패 |
| price는 0보다 큰 정수여야 함 | 등록 실패 |
| weight_g는 0보다 큰 정수여야 함 | 등록 실패 |
| product_url은 URL 형식이어야 함 | 등록 실패 |
| last_checked_at은 날짜 형식이어야 함 | 등록 실패 |

### 16.2 가격 검증

```text
calculated_price_per_100g = round(price / weight_g * 100)
```

규칙:

- 입력된 `price_per_100g`이 계산값과 다르면 계산값을 우선한다.
- 가격 비교와 랭킹에는 계산값만 사용한다.
- `price_per_100g`이 비정상적으로 낮거나 높은 경우 운영자 확인 대상으로 표시한다.

운영자 확인 기준 예시:

| 조건 | 처리 |
| --- | --- |
| price_per_100g < 1000 | 확인 필요 |
| price_per_100g > 50000 | 확인 필요 |
| weight_g < 50 | 확인 필요 |
| weight_g > 2000 | 확인 필요 |

### 16.3 날짜 검증

- `last_checked_at`이 현재 날짜보다 미래이면 등록 실패
- `last_checked_at`이 90일 이상 지났으면 갱신 필요 표시
- `updated_at`은 `created_at`보다 빠를 수 없음

## 17. API 응답용 평탄화 필드

논리 데이터는 중첩 구조를 사용하지만, 화면 구현을 쉽게 하기 위해 API 응답에서는 일부 필드를 평탄화할 수 있다.

| 논리 필드 | 응답 필드 |
| --- | --- |
| primary_package.price | price |
| primary_package.weight_g | weight_g |
| primary_package.price_per_100g | price_per_100g |
| primary_package.product_url | product_url |
| origin.country | origin_country |
| origin.region | origin_region |
| taste_profile.acidity | acidity |
| taste_profile.sweetness | sweetness |
| taste_profile.bitterness | bitterness |
| taste_profile.body | body |
| flags.is_decaf | is_decaf |
| flags.is_available | is_available |
| source.last_checked_at | last_checked_at |

검색 결과 카드 응답에 필요한 최소 필드:

```json
{
  "id": "bean_sample_ethiopia_yirgacheffe_001",
  "slug": "sample-ethiopia-yirgacheffe",
  "name": "에티오피아 예가체프 내추럴",
  "roastery_name": "샘플 로스터리",
  "price": 18000,
  "weight_g": 200,
  "price_per_100g": 9000,
  "origin_country": "Ethiopia",
  "roast_level": "light",
  "acidity": 4,
  "body": 2,
  "tasting_notes": ["베리", "꽃향", "시트러스"],
  "recommended_brew_methods": ["핸드드립", "콜드브루"],
  "image_url": null,
  "is_decaf": false,
  "is_available": true
}
```

## 18. 이벤트 데이터

### 18.1 공통 이벤트 필드

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| event_id | string | 필수 | 이벤트 고유 ID |
| event_name | string | 필수 | 이벤트명 |
| occurred_at | string | 필수 | 발생 시각 |
| session_id | string | 필수 | 익명 세션 ID |
| page_path | string | 필수 | 발생 화면 |
| properties | object | 선택 | 이벤트별 속성 |

MVP에서는 로그인 사용자 식별자를 저장하지 않는다.

### 18.2 이벤트별 properties

| 이벤트 | properties |
| --- | --- |
| search_submitted | query, filters, sort, result_count |
| filter_changed | filter_name, filter_value, result_count |
| sort_changed | sort_key |
| bean_card_clicked | bean_id, source |
| bean_detail_viewed | bean_id |
| compare_added | bean_id, compare_count |
| compare_removed | bean_id, compare_count |
| compare_viewed | bean_ids |
| outbound_clicked | bean_id, roastery_id, url_type |
| category_opened | category_key |
| ranking_opened | ranking_key |

## 19. CSV 입력 시 최소 컬럼

운영자가 CSV로 초기 데이터를 입력할 경우 최소 컬럼은 다음과 같다.

| 컬럼 | 매핑 필드 |
| --- | --- |
| id | Bean.id |
| name | Bean.name |
| roastery_id | Bean.roastery_id |
| origin_country | Bean.origin.country |
| origin_region | Bean.origin.region |
| variety | Bean.variety |
| process | Bean.process |
| roast_level | Bean.roast_level |
| tasting_notes | Bean.tasting_notes, 쉼표 구분 |
| acidity | Bean.taste_profile.acidity |
| sweetness | Bean.taste_profile.sweetness |
| bitterness | Bean.taste_profile.bitterness |
| body | Bean.taste_profile.body |
| aroma | Bean.taste_profile.aroma |
| balance | Bean.taste_profile.balance |
| recommended_brew_methods | Bean.recommended_brew_methods, 쉼표 구분 |
| price | Bean.primary_package.price |
| weight_g | Bean.primary_package.weight_g |
| product_url | Bean.primary_package.product_url |
| image_url | Bean.media.image_url |
| is_decaf | Bean.flags.is_decaf |
| is_available | Bean.flags.is_available |
| source_url | Bean.source.url |
| last_checked_at | Bean.source.last_checked_at |

규칙:

- CSV에서 `price_per_100g`은 입력하지 않아도 된다.
- 쉼표 구분 필드는 import 단계에서 배열로 변환한다.
- 빈 문자열은 `null`로 변환한다.

## 20. 데이터 갱신 정책

### 20.1 갱신 주기

| 데이터 | 권장 갱신 주기 |
| --- | --- |
| 가격 | 30일 |
| 판매 상태 | 30일 |
| 상품 URL | 30일 |
| 컵노트와 맛 점수 | 원두 정보 변경 시 |
| 로스터리 정보 | 90일 |

### 20.2 stale 데이터

다음 조건에 해당하면 운영자 점검 대상이다.

- `last_checked_at`이 90일 이상 지남
- `product_url`이 접근 불가능한 것으로 확인됨
- 가격 또는 용량이 판매처와 다름
- 판매 중인 것으로 저장되어 있으나 실제 품절 상태임

## 21. 보안과 개인정보

- MVP 데이터 모델에는 사용자 개인정보를 저장하지 않는다.
- 이벤트 로그의 `session_id`는 익명 식별자만 사용한다.
- 외부 판매처 URL에는 불필요한 개인 식별 파라미터를 저장하지 않는다.
- 운영자가 입력한 내부 메모는 사용자 API에 노출하지 않는다.

## 22. 구현 전 확인 사항

개발 시작 전 결정해야 할 항목:

- 초기 데이터 저장 방식: JSON, CSV, DB seed 중 선택
- 원두 URL에 `id`를 쓸지 `slug`를 쓸지 결정
- 컵노트 표준 사전의 1차 범위
- 로스터리 1차 수집 대상
- 가격 갱신 주기와 담당 방식
- 이미지 저장 방식: 외부 URL 유지 또는 자체 저장
- 평점과 리뷰 수를 초기 MVP에 포함할지 여부

## 23. 다음 문서로 넘길 내용

다음 문서에서 구체화할 내용:

- `API_SPEC.md`: 검색, 상세, 비교, 카테고리, 랭킹 API 요청/응답
- `TECHNICAL_DESIGN.md`: 저장소, 검색 방식, 아키텍처, 캐싱 전략
- `TEST_PLAN.md`: 데이터 검증, 검색, 필터, 정렬 테스트 케이스
