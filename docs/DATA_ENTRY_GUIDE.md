# 커피 원두 데이터 입력 가이드

문서 버전: v0.1  
작성일: 2026-05-08  
제품명: Bean Finder, 가칭  
연관 문서: [DATA_SPEC.md](./DATA_SPEC.md), [TAGGING_GUIDE.md](./TAGGING_GUIDE.md), [TEST_PLAN.md](./TEST_PLAN.md)  
문서 목적: 운영자가 원두 데이터를 일관되게 수집, 입력, 검증할 수 있도록 기준과 절차를 정의한다.

## 1. 기본 원칙

원두 데이터는 사용자의 구매 판단에 직접 영향을 준다. 특히 가격, 용량, 판매 상태, 판매처 URL은 정확해야 한다.

입력 원칙:

- 공식 로스터리 정보를 최우선으로 사용한다.
- 가격과 용량은 판매 중인 대표 상품 기준으로 입력한다.
- 모든 가격은 원화 정수로 입력한다.
- `price_per_100g`은 직접 입력하지 않고 계산한다.
- 맛 점수는 [TAGGING_GUIDE.md](./TAGGING_GUIDE.md)의 기준을 따른다.
- 출처와 마지막 확인일을 반드시 남긴다.

## 2. 데이터 소스 우선순위

| 우선순위 | 소스 | 사용 예 |
| --- | --- | --- |
| 1 | 로스터리 공식 상품 페이지 | 원두명, 가격, 용량, 컵노트, 로스팅 |
| 2 | 로스터리 공식 스마트스토어/마켓 | 가격, 판매 상태, 이미지 |
| 3 | 공식 SNS 또는 공지 | 품절, 시즌 상품, 한정 판매 |
| 4 | 운영자 태깅 | 산미, 바디감, 쉬운 표현 |
| 5 | 사용자 피드백 | 추후 맛 점수 보정 |

비공식 블로그, 커뮤니티 글, 중고 거래 정보는 MVP 데이터 소스로 사용하지 않는다.

## 3. 입력 대상 선정 기준

우선 입력할 원두:

- 현재 판매 중인 원두
- 가격과 용량이 명확한 원두
- 원산지, 로스팅, 컵노트가 확인 가능한 원두
- 국내 사용자가 구매 가능한 원두
- 입문자 또는 홈카페 사용자가 많이 찾을 가능성이 높은 원두

후순위로 미룰 원두:

- 가격이 확인되지 않는 원두
- 판매처 URL이 없는 원두
- 품절 또는 단종 가능성이 높은 원두
- 설명이 너무 부족해 맛 점수 태깅이 어려운 원두
- 매우 한정적인 이벤트 상품

## 4. 필수 입력 필드

| 필드 | 입력 기준 |
| --- | --- |
| id | 중복 없는 고유 ID |
| slug | URL에 사용할 짧은 식별자 |
| name | 상품명 기준 원두명 |
| roastery_id | 등록된 로스터리 ID |
| origin.country | 원산지 국가 |
| roast_level | light, medium, medium_dark, dark 중 하나 |
| tasting_notes | 표준 컵노트 key 1개 이상 |
| taste_profile.acidity | 1-5 정수 |
| taste_profile.sweetness | 1-5 정수 |
| taste_profile.bitterness | 1-5 정수 |
| taste_profile.body | 1-5 정수 |
| recommended_brew_methods | 1개 이상 |
| primary_package.price | 원화 정수 |
| primary_package.weight_g | g 단위 정수 |
| primary_package.currency | KRW |
| primary_package.product_url | 판매처 URL |
| flags.is_decaf | true 또는 false |
| flags.is_available | true 또는 false |
| source.type | 출처 유형 |
| source.name | 출처명 |
| source.last_checked_at | YYYY-MM-DD |

## 5. 선택 입력 필드

가능하면 입력한다.

| 필드 | 입력 기준 |
| --- | --- |
| origin.region | 생산 지역 |
| origin.farm | 농장 |
| origin.producer | 생산자 |
| variety | 품종 |
| process | washed, natural, honey 등 |
| taste_profile.aroma | 향미 강도 1-5 |
| taste_profile.balance | 밸런스 1-5 |
| media.image_url | 대표 이미지 URL |
| rating.average | 평점 |
| rating.count | 리뷰 수 |
| source.url | 데이터 출처 URL |

선택 필드가 없으면 `null`로 입력한다. 임의 추정으로 채우지 않는다.

## 6. ID와 Slug 규칙

### 6.1 id

권장 형식:

```text
bean_{roastery_slug}_{origin_or_blend}_{sequence}
```

예시:

```text
bean_sample_ethiopia_yirgacheffe_001
bean_sample_daily_blend_001
```

규칙:

- 소문자 영문, 숫자, underscore만 사용한다.
- 한 번 생성한 ID는 변경하지 않는다.
- 같은 원두의 가격이 바뀌어도 ID는 유지한다.

### 6.2 slug

권장 형식:

```text
{roastery-slug}-{bean-name}
```

예시:

```text
sample-ethiopia-yirgacheffe
sample-daily-blend
```

규칙:

- 소문자 영문, 숫자, hyphen만 사용한다.
- 중복되면 뒤에 숫자를 붙인다.

## 7. 가격과 용량 입력

### 7.1 대표 상품 선택

같은 원두에 여러 용량이 있으면 MVP에서는 대표 상품 1개를 입력한다.

우선순위:

1. 로스터리가 기본으로 노출하는 용량
2. 200g 또는 250g 상품
3. 가장 구매 접근성이 높은 상품
4. 소분 샘플이 아닌 일반 판매 상품

### 7.2 가격

입력 기준:

- 할인 전 정가가 명확하면 정가를 사용한다.
- 상시 할인가만 표시되면 현재 판매가를 사용한다.
- 쿠폰, 적립금, 배송비는 가격에 포함하지 않는다.
- 세트 상품 가격은 단일 원두 가격으로 환산하지 않는다.

### 7.3 100g당 가격

직접 입력하지 않는다.

```text
price_per_100g = round(price / weight_g * 100)
```

예시:

```text
18,000원 / 200g * 100 = 9,000원
12,000원 / 250g * 100 = 4,800원
```

## 8. 판매 상태

`is_available` 기준:

| 상태 | 값 |
| --- | --- |
| 판매 중 | true |
| 품절 | false |
| 단종 | false |
| 페이지는 있으나 구매 불가 | false |
| 예약 판매 | true, 단 별도 메모 권장 |

품절 원두도 검색 품질 검증을 위해 데이터에 남길 수 있지만, 기본 검색 결과에서는 제외된다.

## 9. 원산지와 가공 방식

### 9.1 원산지

입력 기준:

- 국가명은 영어 표기를 기본으로 한다.
- 지역은 확인 가능할 때만 입력한다.
- 블렌드는 대표 원산지가 명확하지 않으면 `Blend` 또는 `Multiple` 정책을 별도로 정한다.

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

### 9.2 가공 방식

허용 값:

- washed
- natural
- honey
- anaerobic
- semi_washed
- blend
- unknown

공식 정보에 없으면 `unknown`으로 입력한다.

## 10. 컵노트 입력

컵노트는 자유 텍스트가 아니라 표준 key 배열로 입력한다.

예시:

```json
["berry", "floral", "citrus"]
```

규칙:

- 공식 상품 페이지의 표현을 우선한다.
- 같은 의미는 표준 key로 통합한다.
- 너무 세밀한 표현은 상위 그룹으로 매핑한다.
- 표준 사전에 없는 표현은 운영자 검토 후 사전에 추가한다.

예:

| 원문 표현 | 표준 key |
| --- | --- |
| 블루베리 | berry 또는 blueberry |
| 다크초콜릿 | chocolate 또는 cacao |
| 아몬드 | almond |
| 재스민 | jasmine |
| 레몬 | citrus 또는 lemon |

## 11. 맛 점수 입력

맛 점수는 `TAGGING_GUIDE.md`를 따른다.

필수 점수:

- acidity
- sweetness
- bitterness
- body

선택 점수:

- aroma
- balance

점수 범위:

| 점수 | 의미 |
| --- | --- |
| 1 | 매우 낮음 |
| 2 | 낮음 |
| 3 | 보통 |
| 4 | 높음 |
| 5 | 매우 높음 |

공식 설명만으로 판단이 어려우면 로스팅, 컵노트, 원산지, 추출 추천 정보를 함께 참고한다.

## 12. 추천 추출 방식 입력

허용 값:

- hand_drip
- espresso
- latte
- cold_brew
- moka_pot
- french_press

입력 기준:

- 로스터리 공식 추천을 우선한다.
- 라떼용은 `latte`와 `espresso`를 함께 넣을 수 있다.
- 산미가 밝고 향미가 섬세한 원두는 `hand_drip`을 우선 고려한다.
- 다크 로스팅, 묵직한 바디감, 초콜릿/견과 계열은 `espresso`, `latte`를 고려한다.

## 13. 이미지 입력

이미지 입력 기준:

- 공식 상품 이미지 URL을 우선한다.
- 이미지 사용 권한이 불명확하면 비워둘 수 있다.
- 이미지가 없으면 화면에서 기본 이미지를 사용한다.

`image_alt` 기준:

```text
{로스터리명} {원두명}
```

예:

```text
샘플 로스터리 에티오피아 예가체프 내추럴
```

## 14. 출처 입력

예시:

```json
{
  "type": "roastery_official",
  "name": "샘플 로스터리 공식몰",
  "url": "https://example.com/products/ethiopia-yirgacheffe",
  "last_checked_at": "2026-05-08",
  "tagged_by": "operator"
}
```

`source.type` 허용 값:

- roastery_official
- marketplace
- operator_tagging
- user_feedback

공식 상품 페이지가 있으면 `roastery_official`을 사용한다.

## 15. CSV 입력 기준

초기 수집을 CSV로 할 경우 최소 컬럼:

```text
id,name,roastery_id,origin_country,origin_region,variety,process,roast_level,tasting_notes,acidity,sweetness,bitterness,body,aroma,balance,recommended_brew_methods,price,weight_g,product_url,image_url,is_decaf,is_available,source_url,last_checked_at
```

규칙:

- 배열 값은 쉼표 대신 파이프 `|` 구분을 권장한다.
- 빈 값은 import 단계에서 `null`로 변환한다.
- `price_per_100g`은 CSV에 넣지 않는다.

예:

```text
bean_sample_001,에티오피아 예가체프,roastery_sample,Ethiopia,Yirgacheffe,Heirloom,natural,light,berry|floral|citrus,4,4,1,2,5,4,hand_drip|cold_brew,18000,200,https://example.com/products/1,,false,true,https://example.com/products/1,2026-05-08
```

## 16. JSON 입력 예시

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
  "recommended_brew_methods": ["hand_drip", "cold_brew"],
  "primary_package": {
    "price": 18000,
    "weight_g": 200,
    "currency": "KRW",
    "product_url": "https://example.com/products/ethiopia-yirgacheffe",
    "affiliate_url": null,
    "package_label": "200g"
  },
  "media": {
    "image_url": null,
    "image_alt": "샘플 로스터리 에티오피아 예가체프 내추럴"
  },
  "flags": {
    "is_decaf": false,
    "is_available": true,
    "is_blend": false,
    "is_featured": false
  },
  "source": {
    "type": "roastery_official",
    "name": "샘플 로스터리 공식몰",
    "url": "https://example.com/products/ethiopia-yirgacheffe",
    "last_checked_at": "2026-05-08",
    "tagged_by": "operator"
  }
}
```

## 17. 입력 전 체크리스트

- 원두명이 공식 상품명과 일치한다.
- 로스터리 ID가 존재한다.
- 가격과 용량이 정확하다.
- 판매처 URL이 열린다.
- 100g당 가격은 직접 입력하지 않았다.
- 컵노트가 표준 key로 입력되었다.
- 맛 점수가 1-5 정수다.
- 추천 추출 방식이 1개 이상 있다.
- 디카페인 여부가 입력되어 있다.
- 판매 상태가 입력되어 있다.
- 출처 URL과 확인일이 있다.

## 18. 검수 체크리스트

데이터 입력 후 다음을 확인한다.

- 데이터 검증 스크립트가 통과한다.
- 검색 결과 카드에 원두가 표시된다.
- 상세 화면에서 원두 정보가 표시된다.
- 가격과 100g당 가격이 맞다.
- 필터 조건에 맞게 검색된다.
- 카테고리와 랭킹에 의도대로 포함된다.
- 판매처 이동이 정상 동작한다.
- 이미지가 없으면 기본 이미지가 표시된다.

## 19. 자주 발생하는 오류

| 오류 | 원인 | 해결 |
| --- | --- | --- |
| 검색에 원두가 안 나옴 | `is_available=false` 또는 필수 필드 누락 | 판매 상태와 검증 결과 확인 |
| 가격 랭킹이 이상함 | 용량 입력 오류 | `weight_g` 확인 |
| 컵노트 필터가 안 됨 | 표준 key가 아님 | 컵노트 사전 확인 |
| 상세 화면 오류 | 필수 nested field 누락 | schema 검증 실행 |
| 판매처 버튼 없음 | product_url 누락 또는 품절 | URL과 판매 상태 확인 |

## 20. 갱신 정책

권장 갱신 주기:

| 데이터 | 주기 |
| --- | --- |
| 가격 | 30일 |
| 판매 상태 | 30일 |
| 상품 URL | 30일 |
| 로스터리 정보 | 90일 |
| 컵노트와 맛 점수 | 상품 설명 변경 시 |

`last_checked_at`이 90일 이상 지난 데이터는 운영자 점검 대상으로 표시한다.

