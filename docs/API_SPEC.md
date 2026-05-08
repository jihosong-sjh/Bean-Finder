# 커피 원두 검색 엔진 API 명세서

문서 버전: v0.1  
작성일: 2026-05-08  
제품명: Bean Finder, 가칭  
연관 문서: [PRD.md](./PRD.md), [FUNCTIONAL_SPEC.md](./FUNCTIONAL_SPEC.md), [SCREEN_SPEC.md](./SCREEN_SPEC.md), [DATA_SPEC.md](./DATA_SPEC.md)  
문서 목적: Bean Finder MVP의 프론트엔드와 백엔드 또는 데이터 레이어가 주고받는 API 요청, 응답, 오류 형식, 상태 코드를 정의한다.

## 1. 범위

이 문서는 MVP 사용자 화면에서 필요한 API를 정의한다.

포함 API:

- 홈 메타데이터 조회
- 원두 검색
- 원두 상세 조회
- 원두 batch 조회
- 유사 원두 조회
- 카테고리 목록 및 카테고리별 원두 조회
- 랭킹 목록 및 랭킹별 원두 조회
- 필터 옵션 조회
- 이벤트 로깅
- 내부 데이터 검증

제외 API:

- 회원가입
- 로그인
- 결제
- 사용자 리뷰 작성
- 찜 목록 저장
- 개인화 추천
- 자동 크롤링 작업 제어
- 관리자 웹 CRUD

## 2. API 설계 원칙

### 2.1 버전

모든 API는 `/api/v1` prefix를 사용한다.

```text
/api/v1/beans/search
/api/v1/beans/{beanId}
```

### 2.2 데이터 형식

- 요청과 응답은 JSON을 기본으로 한다.
- 날짜와 시간은 ISO 8601 문자열을 사용한다.
- 금액은 원화 기준 정수로 주고받는다.
- 목록 응답에는 pagination 메타데이터를 포함한다.
- 화면에 필요한 표시명은 API에서 제공한다.

### 2.3 인증

MVP의 사용자-facing API는 인증을 요구하지 않는다.

내부 운영 API는 추후 인증을 붙이는 전제로 명세만 정의한다. 실제 구현 시에는 관리자 인증 또는 내부 네트워크 제한이 필요하다.

### 2.4 비교함

비교함 상태는 클라이언트가 관리한다. 서버는 비교함을 저장하지 않는다.

비교 화면은 클라이언트가 보관 중인 `bean_id` 목록을 `GET /api/v1/beans/batch`로 전달해 필요한 원두 요약 정보를 조회한다.

### 2.5 판매처 이동

판매처 이동 자체는 외부 URL을 새 탭으로 여는 프론트엔드 동작이다. 서버 API는 판매처 URL을 제공하고, 클릭 이벤트는 `POST /api/v1/events`로 기록한다.

## 3. 공통 요청 규칙

### 3.1 Headers

권장 요청 헤더:

```http
Accept: application/json
Content-Type: application/json
```

이벤트 로깅 요청에는 익명 세션 식별자를 포함할 수 있다.

```http
X-Session-Id: anonymous-session-id
```

### 3.2 Query String

- 배열 값은 쉼표 구분 문자열을 사용한다.
- 빈 값은 전달하지 않는다.
- 알 수 없는 파라미터는 무시한다.

예시:

```text
/api/v1/beans/search?q=라떼&body=heavy&brew_method=latte,espresso
```

### 3.3 Pagination

목록 API는 `page`와 `limit`을 사용한다.

| 파라미터 | 타입 | 기본값 | 제한 |
| --- | --- | --- | --- |
| page | integer | 1 | 1 이상 |
| limit | integer | 20 | 1-50 |

응답 메타데이터:

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_count": 132,
    "total_pages": 7,
    "has_next": true,
    "has_prev": false
  }
}
```

### 3.4 정렬

`sort` 파라미터는 다음 값을 사용한다.

| sort | 설명 |
| --- | --- |
| recommended | 추천순 |
| price_asc | 가격 낮은 순 |
| price_per_100g_asc | 100g당 가격 낮은 순 |
| rating_desc | 평점 높은 순 |
| review_count_desc | 리뷰 많은 순 |
| acidity_desc | 산미 강한 순 |
| body_desc | 바디감 강한 순 |
| newest | 최신 등록순 |

기본값은 `recommended`이다.

## 4. 공통 응답 형식

### 4.1 성공 응답

단일 리소스:

```json
{
  "data": {},
  "meta": {
    "request_id": "req_abc123"
  }
}
```

목록 리소스:

```json
{
  "data": [],
  "meta": {
    "request_id": "req_abc123",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total_count": 132,
      "total_pages": 7,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### 4.2 오류 응답

```json
{
  "error": {
    "code": "INVALID_QUERY",
    "message": "요청 파라미터가 올바르지 않습니다.",
    "details": [
      {
        "field": "price_per_100g_min",
        "reason": "최소값은 최대값보다 클 수 없습니다."
      }
    ]
  },
  "meta": {
    "request_id": "req_abc123"
  }
}
```

### 4.3 공통 오류 코드

| HTTP | code | 설명 |
| --- | --- | --- |
| 400 | INVALID_QUERY | 쿼리 파라미터 오류 |
| 400 | INVALID_BODY | 요청 body 오류 |
| 404 | NOT_FOUND | 리소스를 찾을 수 없음 |
| 409 | DUPLICATE_RESOURCE | 중복 데이터 |
| 422 | VALIDATION_FAILED | 데이터 검증 실패 |
| 429 | RATE_LIMITED | 요청 제한 초과 |
| 500 | INTERNAL_ERROR | 서버 오류 |

## 5. 공통 모델

### 5.1 BeanCard

검색 결과, 카테고리, 랭킹, 유사 원두에 사용하는 카드용 요약 모델이다.

```json
{
  "id": "bean_sample_ethiopia_yirgacheffe_001",
  "slug": "sample-ethiopia-yirgacheffe",
  "name": "에티오피아 예가체프 내추럴",
  "roastery": {
    "id": "roastery_sample",
    "name": "샘플 로스터리"
  },
  "origin": {
    "country": "Ethiopia",
    "region": "Yirgacheffe"
  },
  "roast_level": {
    "key": "light",
    "label": "라이트"
  },
  "price": 18000,
  "weight_g": 200,
  "price_per_100g": 9000,
  "currency": "KRW",
  "taste_summary": {
    "acidity": {
      "score": 4,
      "label": "높음"
    },
    "body": {
      "score": 2,
      "label": "가벼움"
    }
  },
  "tasting_notes": [
    {
      "key": "berry",
      "label": "베리"
    },
    {
      "key": "floral",
      "label": "꽃향"
    }
  ],
  "easy_taste_tags": ["산미 있음", "과일향", "가벼움"],
  "recommended_brew_methods": [
    {
      "key": "hand_drip",
      "label": "핸드드립"
    }
  ],
  "image_url": null,
  "image_alt": "샘플 로스터리 에티오피아 예가체프 내추럴",
  "is_decaf": false,
  "is_available": true,
  "product_url": "https://example.com/products/ethiopia-yirgacheffe"
}
```

### 5.2 BeanDetail

원두 상세 화면에 사용하는 모델이다.

```json
{
  "id": "bean_sample_ethiopia_yirgacheffe_001",
  "slug": "sample-ethiopia-yirgacheffe",
  "name": "에티오피아 예가체프 내추럴",
  "roastery": {
    "id": "roastery_sample",
    "slug": "sample-roastery",
    "name": "샘플 로스터리",
    "website_url": "https://example.com"
  },
  "origin": {
    "country": "Ethiopia",
    "country_code": "ET",
    "region": "Yirgacheffe",
    "farm": null,
    "producer": null
  },
  "variety": "Heirloom",
  "process": {
    "key": "natural",
    "label": "내추럴"
  },
  "roast_level": {
    "key": "light",
    "label": "라이트"
  },
  "tasting_notes": [
    {
      "key": "berry",
      "label": "베리",
      "group": "berry"
    }
  ],
  "taste_profile": {
    "acidity": {
      "score": 4,
      "label": "높음"
    },
    "sweetness": {
      "score": 4,
      "label": "높음"
    },
    "bitterness": {
      "score": 1,
      "label": "매우 낮음"
    },
    "body": {
      "score": 2,
      "label": "낮음"
    },
    "aroma": {
      "score": 5,
      "label": "매우 높음"
    },
    "balance": {
      "score": 4,
      "label": "높음"
    }
  },
  "easy_taste_tags": ["산미 있음", "과일향", "꽃향", "가벼움"],
  "recommended_brew_methods": [
    {
      "key": "hand_drip",
      "label": "핸드드립"
    }
  ],
  "package": {
    "price": 18000,
    "weight_g": 200,
    "price_per_100g": 9000,
    "currency": "KRW",
    "package_label": "200g",
    "product_url": "https://example.com/products/ethiopia-yirgacheffe",
    "affiliate_url": null
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
    "last_checked_at": "2026-05-08"
  }
}
```

### 5.3 FilterOptions

```json
{
  "price_ranges": [
    {
      "key": "under_10000",
      "label": "1만원 이하"
    }
  ],
  "acidity": [
    {
      "key": "low",
      "label": "낮음"
    }
  ],
  "body": [
    {
      "key": "heavy",
      "label": "묵직함"
    }
  ],
  "roast_levels": [
    {
      "key": "light",
      "label": "라이트"
    }
  ],
  "origins": [
    {
      "key": "Ethiopia",
      "label": "Ethiopia",
      "count": 24
    }
  ],
  "tasting_notes": [
    {
      "key": "berry",
      "label": "베리",
      "group": "berry"
    }
  ],
  "brew_methods": [
    {
      "key": "hand_drip",
      "label": "핸드드립"
    }
  ]
}
```

## 6. Endpoint 요약

| Method | Endpoint | 설명 | 화면 |
| --- | --- | --- | --- |
| GET | `/api/v1/home` | 홈 메타데이터 조회 | SC-001 |
| GET | `/api/v1/beans/search` | 원두 검색 | SC-002 |
| GET | `/api/v1/beans/batch` | 여러 원두 요약 조회 | SC-004 |
| GET | `/api/v1/beans/{beanId}` | 원두 상세 조회 | SC-003 |
| GET | `/api/v1/beans/{beanId}/similar` | 유사 원두 조회 | SC-003 |
| GET | `/api/v1/categories` | 카테고리 목록 조회 | SC-001, SC-005 |
| GET | `/api/v1/categories/{categoryKey}/beans` | 카테고리 원두 조회 | SC-005 |
| GET | `/api/v1/rankings` | 랭킹 목록 조회 | SC-001, SC-006 |
| GET | `/api/v1/rankings/{rankingKey}/beans` | 랭킹 원두 조회 | SC-006 |
| GET | `/api/v1/filter-options` | 필터 옵션 조회 | SC-002, SC-005 |
| POST | `/api/v1/events` | 이벤트 기록 | 전체 |
| POST | `/api/v1/internal/beans/validate` | 내부 원두 데이터 검증 | 운영 |

## 7. GET /api/v1/home

### 7.1 목적

홈 화면에 필요한 추천 검색어, 카테고리, 랭킹 진입 정보를 조회한다.

### 7.2 Request

```http
GET /api/v1/home
```

### 7.3 Response

```json
{
  "data": {
    "suggested_queries": [
      "신맛 적은 원두",
      "라떼에 좋은 원두",
      "2만원 이하 원두",
      "베리향 에티오피아"
    ],
    "featured_categories": [
      {
        "key": "low-acidity",
        "title": "신맛 적은 원두",
        "description": "산미가 낮고 고소하거나 묵직한 느낌의 원두입니다."
      }
    ],
    "featured_rankings": [
      {
        "key": "price-per-100g",
        "title": "100g당 가격 낮은 원두",
        "description": "용량 차이를 반영한 가격 기준 랭킹입니다."
      }
    ]
  },
  "meta": {
    "request_id": "req_abc123"
  }
}
```

### 7.4 오류

| HTTP | code | 조건 |
| --- | --- | --- |
| 500 | INTERNAL_ERROR | 홈 메타데이터 조회 실패 |

## 8. GET /api/v1/beans/search

### 8.1 목적

검색어, 필터, 정렬 조건에 맞는 원두 목록을 조회한다.

### 8.2 Request

```http
GET /api/v1/beans/search?q=라떼&body=heavy&sort=price_per_100g_asc&page=1&limit=20
```

### 8.3 Query Parameters

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| q | string | 선택 | 검색어 |
| price_range | string | 선택 | 가격대 key |
| price_min | integer | 선택 | 최소 판매 가격 |
| price_max | integer | 선택 | 최대 판매 가격 |
| price_per_100g_min | integer | 선택 | 최소 100g당 가격 |
| price_per_100g_max | integer | 선택 | 최대 100g당 가격 |
| acidity | string | 선택 | low, medium, high |
| body | string | 선택 | light, medium, heavy |
| roast_level | string | 선택 | 쉼표 구분 enum |
| origin_country | string | 선택 | 쉼표 구분 국가명 또는 코드 |
| tasting_notes | string | 선택 | 쉼표 구분 컵노트 key |
| tasting_note_groups | string | 선택 | 쉼표 구분 컵노트 group |
| brew_method | string | 선택 | 쉼표 구분 추출 방식 |
| is_decaf | boolean | 선택 | 디카페인 여부 |
| availability | string | 선택 | available_only, include_sold_out |
| sort | string | 선택 | 정렬 key |
| page | integer | 선택 | 페이지 |
| limit | integer | 선택 | 페이지 크기 |

기본값:

| 파라미터 | 기본값 |
| --- | --- |
| availability | available_only |
| sort | recommended |
| page | 1 |
| limit | 20 |

### 8.4 Response

```json
{
  "data": [
    {
      "id": "bean_sample_ethiopia_yirgacheffe_001",
      "slug": "sample-ethiopia-yirgacheffe",
      "name": "에티오피아 예가체프 내추럴",
      "roastery": {
        "id": "roastery_sample",
        "name": "샘플 로스터리"
      },
      "origin": {
        "country": "Ethiopia",
        "region": "Yirgacheffe"
      },
      "roast_level": {
        "key": "light",
        "label": "라이트"
      },
      "price": 18000,
      "weight_g": 200,
      "price_per_100g": 9000,
      "currency": "KRW",
      "taste_summary": {
        "acidity": {
          "score": 4,
          "label": "높음"
        },
        "body": {
          "score": 2,
          "label": "가벼움"
        }
      },
      "tasting_notes": [
        {
          "key": "berry",
          "label": "베리"
        }
      ],
      "easy_taste_tags": ["산미 있음", "과일향"],
      "recommended_brew_methods": [
        {
          "key": "hand_drip",
          "label": "핸드드립"
        }
      ],
      "image_url": null,
      "image_alt": "샘플 로스터리 에티오피아 예가체프 내추럴",
      "is_decaf": false,
      "is_available": true,
      "product_url": "https://example.com/products/ethiopia-yirgacheffe"
    }
  ],
  "meta": {
    "request_id": "req_abc123",
    "query": {
      "q": "라떼",
      "filters": {
        "body": "heavy"
      },
      "sort": "price_per_100g_asc"
    },
    "result_count": 132,
    "pagination": {
      "page": 1,
      "limit": 20,
      "total_count": 132,
      "total_pages": 7,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### 8.5 동작 규칙

- `q`가 없으면 전체 원두 목록을 반환한다.
- 기본적으로 `is_available = true`인 원두만 반환한다.
- `availability=include_sold_out`이면 품절 원두도 포함한다.
- 서로 다른 필터 그룹은 AND 조건으로 적용한다.
- 같은 필터 그룹 안의 복수 값은 OR 조건으로 적용한다.
- `price_per_100g_min`이 `price_per_100g_max`보다 크면 400 오류를 반환한다.
- 알 수 없는 enum 값은 무시하지 않고 400 오류를 반환한다.

### 8.6 오류

| HTTP | code | 조건 |
| --- | --- | --- |
| 400 | INVALID_QUERY | 잘못된 필터 값 |
| 400 | INVALID_QUERY | 가격 최소값이 최대값보다 큼 |
| 500 | INTERNAL_ERROR | 검색 처리 실패 |

## 9. GET /api/v1/beans/batch

### 9.1 목적

비교 화면에서 여러 원두의 카드 또는 비교용 요약 정보를 한 번에 조회한다.

### 9.2 Request

```http
GET /api/v1/beans/batch?ids=bean_a,bean_b,bean_c
```

### 9.3 Query Parameters

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| ids | string | 필수 | 쉼표 구분 bean_id 목록 |

제한:

- 최소 1개
- 최대 4개

### 9.4 Response

```json
{
  "data": [
    {
      "id": "bean_sample_ethiopia_yirgacheffe_001",
      "slug": "sample-ethiopia-yirgacheffe",
      "name": "에티오피아 예가체프 내추럴",
      "roastery": {
        "id": "roastery_sample",
        "name": "샘플 로스터리"
      },
      "price": 18000,
      "weight_g": 200,
      "price_per_100g": 9000,
      "origin": {
        "country": "Ethiopia",
        "region": "Yirgacheffe"
      },
      "roast_level": {
        "key": "light",
        "label": "라이트"
      },
      "taste_profile": {
        "acidity": {
          "score": 4,
          "label": "높음"
        },
        "sweetness": {
          "score": 4,
          "label": "높음"
        },
        "bitterness": {
          "score": 1,
          "label": "매우 낮음"
        },
        "body": {
          "score": 2,
          "label": "낮음"
        }
      },
      "tasting_notes": [
        {
          "key": "berry",
          "label": "베리"
        }
      ],
      "recommended_brew_methods": [
        {
          "key": "hand_drip",
          "label": "핸드드립"
        }
      ],
      "is_available": true,
      "product_url": "https://example.com/products/ethiopia-yirgacheffe"
    }
  ],
  "meta": {
    "request_id": "req_abc123",
    "missing_ids": []
  }
}
```

### 9.5 동작 규칙

- 응답 순서는 요청한 `ids` 순서를 따른다.
- 존재하지 않는 id는 `meta.missing_ids`에 포함한다.
- 존재하지 않는 id가 있어도 나머지 원두는 200으로 반환한다.
- `ids`가 4개를 초과하면 400 오류를 반환한다.

### 9.6 오류

| HTTP | code | 조건 |
| --- | --- | --- |
| 400 | INVALID_QUERY | ids가 비어 있음 |
| 400 | INVALID_QUERY | ids가 4개 초과 |

## 10. GET /api/v1/beans/{beanId}

### 10.1 목적

원두 상세 화면에 필요한 상세 정보를 조회한다.

### 10.2 Request

```http
GET /api/v1/beans/bean_sample_ethiopia_yirgacheffe_001
```

### 10.3 Path Parameters

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| beanId | string | 필수 | 원두 ID 또는 slug |

### 10.4 Response

```json
{
  "data": {
    "id": "bean_sample_ethiopia_yirgacheffe_001",
    "slug": "sample-ethiopia-yirgacheffe",
    "name": "에티오피아 예가체프 내추럴",
    "roastery": {
      "id": "roastery_sample",
      "slug": "sample-roastery",
      "name": "샘플 로스터리",
      "website_url": "https://example.com"
    },
    "origin": {
      "country": "Ethiopia",
      "country_code": "ET",
      "region": "Yirgacheffe",
      "farm": null,
      "producer": null
    },
    "variety": "Heirloom",
    "process": {
      "key": "natural",
      "label": "내추럴"
    },
    "roast_level": {
      "key": "light",
      "label": "라이트"
    },
    "tasting_notes": [
      {
        "key": "berry",
        "label": "베리",
        "group": "berry"
      }
    ],
    "taste_profile": {
      "acidity": {
        "score": 4,
        "label": "높음"
      },
      "sweetness": {
        "score": 4,
        "label": "높음"
      },
      "bitterness": {
        "score": 1,
        "label": "매우 낮음"
      },
      "body": {
        "score": 2,
        "label": "낮음"
      },
      "aroma": {
        "score": 5,
        "label": "매우 높음"
      },
      "balance": {
        "score": 4,
        "label": "높음"
      }
    },
    "easy_taste_tags": ["산미 있음", "과일향", "꽃향", "가벼움"],
    "recommended_brew_methods": [
      {
        "key": "hand_drip",
        "label": "핸드드립"
      }
    ],
    "package": {
      "price": 18000,
      "weight_g": 200,
      "price_per_100g": 9000,
      "currency": "KRW",
      "package_label": "200g",
      "product_url": "https://example.com/products/ethiopia-yirgacheffe",
      "affiliate_url": null
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
      "last_checked_at": "2026-05-08"
    }
  },
  "meta": {
    "request_id": "req_abc123"
  }
}
```

### 10.5 오류

| HTTP | code | 조건 |
| --- | --- | --- |
| 404 | NOT_FOUND | 원두 없음 |
| 500 | INTERNAL_ERROR | 상세 조회 실패 |

## 11. GET /api/v1/beans/{beanId}/similar

### 11.1 목적

원두 상세 화면에서 유사 원두 목록을 조회한다.

### 11.2 Request

```http
GET /api/v1/beans/bean_sample_ethiopia_yirgacheffe_001/similar?limit=6
```

### 11.3 Query Parameters

| 파라미터 | 타입 | 기본값 | 제한 |
| --- | --- | --- | --- |
| limit | integer | 6 | 1-12 |

### 11.4 Response

```json
{
  "data": [
    {
      "id": "bean_similar_001",
      "slug": "similar-bean-001",
      "name": "비슷한 원두",
      "roastery": {
        "id": "roastery_sample",
        "name": "샘플 로스터리"
      },
      "price": 17000,
      "weight_g": 200,
      "price_per_100g": 8500,
      "origin": {
        "country": "Ethiopia",
        "region": null
      },
      "roast_level": {
        "key": "light",
        "label": "라이트"
      },
      "taste_summary": {
        "acidity": {
          "score": 4,
          "label": "높음"
        },
        "body": {
          "score": 2,
          "label": "가벼움"
        }
      },
      "tasting_notes": [
        {
          "key": "berry",
          "label": "베리"
        }
      ],
      "easy_taste_tags": ["산미 있음", "베리향"],
      "recommended_brew_methods": [
        {
          "key": "hand_drip",
          "label": "핸드드립"
        }
      ],
      "image_url": null,
      "image_alt": "샘플 로스터리 비슷한 원두",
      "is_decaf": false,
      "is_available": true,
      "product_url": "https://example.com/products/similar-bean"
    }
  ],
  "meta": {
    "request_id": "req_abc123",
    "base_bean_id": "bean_sample_ethiopia_yirgacheffe_001"
  }
}
```

### 11.5 동작 규칙

- 기준 원두는 결과에서 제외한다.
- 기본적으로 판매 중인 원두를 우선한다.
- 결과가 없으면 빈 배열을 반환한다.

### 11.6 오류

| HTTP | code | 조건 |
| --- | --- | --- |
| 404 | NOT_FOUND | 기준 원두 없음 |

## 12. GET /api/v1/categories

### 12.1 목적

홈과 내비게이션에서 사용할 카테고리 목록을 조회한다.

### 12.2 Request

```http
GET /api/v1/categories
```

### 12.3 Response

```json
{
  "data": [
    {
      "key": "low-acidity",
      "title": "신맛 적은 원두",
      "description": "산미가 낮고 고소하거나 묵직한 느낌의 원두입니다.",
      "default_filters": {
        "acidity": "low"
      },
      "default_sort": "recommended",
      "display_order": 1
    }
  ],
  "meta": {
    "request_id": "req_abc123"
  }
}
```

### 12.4 동작 규칙

- `is_active = true`인 카테고리만 반환한다.
- `display_order` 오름차순으로 반환한다.

## 13. GET /api/v1/categories/{categoryKey}/beans

### 13.1 목적

카테고리 기본 조건과 사용자가 추가한 필터를 적용해 원두 목록을 조회한다.

### 13.2 Request

```http
GET /api/v1/categories/low-acidity/beans?sort=price_asc&page=1&limit=20
```

### 13.3 Path Parameters

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| categoryKey | string | 필수 | 카테고리 key |

### 13.4 Query Parameters

검색 API와 동일한 필터 및 정렬 파라미터를 사용할 수 있다.

추가 파라미터:

| 파라미터 | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| include_category_filter | boolean | true | 카테고리 기본 조건 적용 여부 |

### 13.5 Response

```json
{
  "data": [
    {
      "id": "bean_sample_ethiopia_yirgacheffe_001",
      "slug": "sample-ethiopia-yirgacheffe",
      "name": "에티오피아 예가체프 내추럴",
      "roastery": {
        "id": "roastery_sample",
        "name": "샘플 로스터리"
      },
      "price": 18000,
      "weight_g": 200,
      "price_per_100g": 9000,
      "origin": {
        "country": "Ethiopia",
        "region": "Yirgacheffe"
      },
      "roast_level": {
        "key": "light",
        "label": "라이트"
      },
      "taste_summary": {
        "acidity": {
          "score": 2,
          "label": "낮음"
        },
        "body": {
          "score": 3,
          "label": "보통"
        }
      },
      "tasting_notes": [
        {
          "key": "nutty",
          "label": "견과류"
        }
      ],
      "easy_taste_tags": ["신맛 적음", "고소함"],
      "recommended_brew_methods": [
        {
          "key": "espresso",
          "label": "에스프레소"
        }
      ],
      "image_url": null,
      "image_alt": "샘플 로스터리 에티오피아 예가체프 내추럴",
      "is_decaf": false,
      "is_available": true,
      "product_url": "https://example.com/products/ethiopia-yirgacheffe"
    }
  ],
  "meta": {
    "request_id": "req_abc123",
    "category": {
      "key": "low-acidity",
      "title": "신맛 적은 원두",
      "description": "산미가 낮고 고소하거나 묵직한 느낌의 원두입니다.",
      "default_filters": {
        "acidity": "low"
      }
    },
    "result_count": 42,
    "pagination": {
      "page": 1,
      "limit": 20,
      "total_count": 42,
      "total_pages": 3,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### 13.6 오류

| HTTP | code | 조건 |
| --- | --- | --- |
| 404 | NOT_FOUND | categoryKey가 존재하지 않음 |
| 400 | INVALID_QUERY | 잘못된 필터 값 |

## 14. GET /api/v1/rankings

### 14.1 목적

홈과 랭킹 화면에서 사용할 랭킹 목록을 조회한다.

### 14.2 Request

```http
GET /api/v1/rankings
```

### 14.3 Response

```json
{
  "data": [
    {
      "key": "price-per-100g",
      "title": "100g당 가격 낮은 원두",
      "description": "용량 차이를 반영해 100g당 가격이 낮은 순서로 정렬한 랭킹입니다.",
      "display_order": 1
    }
  ],
  "meta": {
    "request_id": "req_abc123"
  }
}
```

### 14.4 동작 규칙

- `is_active = true`인 랭킹만 반환한다.
- `display_order` 오름차순으로 반환한다.

## 15. GET /api/v1/rankings/{rankingKey}/beans

### 15.1 목적

랭킹 기준에 따라 정렬된 원두 목록을 조회한다.

### 15.2 Request

```http
GET /api/v1/rankings/price-per-100g/beans?limit=50
```

### 15.3 Path Parameters

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| rankingKey | string | 필수 | 랭킹 key |

### 15.4 Query Parameters

| 파라미터 | 타입 | 기본값 | 제한 |
| --- | --- | --- | --- |
| limit | integer | 50 | 1-50 |

### 15.5 Response

```json
{
  "data": [
    {
      "rank": 1,
      "bean": {
        "id": "bean_value_001",
        "slug": "value-bean-001",
        "name": "데일리 블렌드",
        "roastery": {
          "id": "roastery_sample",
          "name": "샘플 로스터리"
        },
        "price": 12000,
        "weight_g": 250,
        "price_per_100g": 4800,
        "origin": {
          "country": "Brazil",
          "region": null
        },
        "roast_level": {
          "key": "medium_dark",
          "label": "미디엄다크"
        },
        "taste_summary": {
          "acidity": {
            "score": 2,
            "label": "낮음"
          },
          "body": {
            "score": 4,
            "label": "묵직함"
          }
        },
        "tasting_notes": [
          {
            "key": "chocolate",
            "label": "초콜릿"
          }
        ],
        "easy_taste_tags": ["신맛 적음", "묵직함", "초콜릿 느낌"],
        "recommended_brew_methods": [
          {
            "key": "espresso",
            "label": "에스프레소"
          }
        ],
        "image_url": null,
        "image_alt": "샘플 로스터리 데일리 블렌드",
        "is_decaf": false,
        "is_available": true,
        "product_url": "https://example.com/products/value-bean-001"
      }
    }
  ],
  "meta": {
    "request_id": "req_abc123",
    "ranking": {
      "key": "price-per-100g",
      "title": "100g당 가격 낮은 원두",
      "description": "용량 차이를 반영해 100g당 가격이 낮은 순서로 정렬한 랭킹입니다.",
      "criteria": "price_per_100g 오름차순"
    },
    "result_count": 50
  }
}
```

### 15.6 동작 규칙

- 랭킹은 기본적으로 판매 중인 원두만 포함한다.
- `rank`는 1부터 시작한다.
- 기준값이 동일하면 추천순, 원두명 오름차순 순서로 보조 정렬한다.

### 15.7 오류

| HTTP | code | 조건 |
| --- | --- | --- |
| 404 | NOT_FOUND | rankingKey가 존재하지 않음 |
| 400 | INVALID_QUERY | limit 범위 초과 |

## 16. GET /api/v1/filter-options

### 16.1 목적

검색 결과와 카테고리 화면에서 사용할 필터 옵션을 조회한다.

### 16.2 Request

```http
GET /api/v1/filter-options
```

선택적으로 현재 검색 조건을 넘겨 필터별 count를 계산할 수 있다.

```http
GET /api/v1/filter-options?q=라떼&availability=available_only
```

### 16.3 Query Parameters

검색 API의 필터 파라미터를 선택적으로 사용할 수 있다.

### 16.4 Response

```json
{
  "data": {
    "price_ranges": [
      {
        "key": "under_10000",
        "label": "1만원 이하",
        "count": 12
      }
    ],
    "acidity": [
      {
        "key": "low",
        "label": "낮음",
        "count": 40
      },
      {
        "key": "medium",
        "label": "보통",
        "count": 52
      },
      {
        "key": "high",
        "label": "높음",
        "count": 28
      }
    ],
    "body": [
      {
        "key": "heavy",
        "label": "묵직함",
        "count": 31
      }
    ],
    "roast_levels": [
      {
        "key": "light",
        "label": "라이트",
        "count": 38
      }
    ],
    "origins": [
      {
        "key": "Ethiopia",
        "label": "Ethiopia",
        "count": 24
      }
    ],
    "tasting_notes": [
      {
        "key": "berry",
        "label": "베리",
        "group": "berry",
        "count": 18
      }
    ],
    "brew_methods": [
      {
        "key": "hand_drip",
        "label": "핸드드립",
        "count": 72
      }
    ]
  },
  "meta": {
    "request_id": "req_abc123"
  }
}
```

### 16.5 동작 규칙

- count는 현재 조건을 기준으로 계산할 수 있다.
- count 계산 비용이 크면 MVP에서는 count를 생략할 수 있다.
- count가 없는 경우 `count: null`로 반환한다.

## 17. POST /api/v1/events

### 17.1 목적

검색, 필터, 상세 진입, 비교, 판매처 이동 등 MVP 검증에 필요한 사용자 행동 이벤트를 기록한다.

### 17.2 Request

```http
POST /api/v1/events
Content-Type: application/json
X-Session-Id: anonymous-session-id
```

```json
{
  "event_name": "search_submitted",
  "occurred_at": "2026-05-08T12:00:00+09:00",
  "page_path": "/search",
  "properties": {
    "query": "라떼에 좋은 원두",
    "filters": {
      "body": "heavy"
    },
    "sort": "recommended",
    "result_count": 42
  }
}
```

### 17.3 Body

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| event_name | string | 필수 | 이벤트명 |
| occurred_at | string | 필수 | 발생 시각 |
| page_path | string | 필수 | 발생 화면 path |
| properties | object | 선택 | 이벤트별 속성 |

### 17.4 event_name 허용 값

- `search_submitted`
- `filter_changed`
- `sort_changed`
- `bean_card_clicked`
- `bean_detail_viewed`
- `compare_added`
- `compare_removed`
- `compare_viewed`
- `outbound_clicked`
- `category_opened`
- `ranking_opened`

### 17.5 Response

```json
{
  "data": {
    "accepted": true
  },
  "meta": {
    "request_id": "req_abc123"
  }
}
```

### 17.6 동작 규칙

- 이벤트 기록 실패가 사용자 화면 동작을 막으면 안 된다.
- 잘못된 이벤트명은 400 오류를 반환한다.
- `properties`에는 개인정보를 저장하지 않는다.
- `outbound_clicked` 이벤트는 외부 링크 열기 직전 또는 직후 기록한다.

### 17.7 오류

| HTTP | code | 조건 |
| --- | --- | --- |
| 400 | INVALID_BODY | 필수 필드 누락 |
| 400 | INVALID_BODY | 허용되지 않은 event_name |

## 18. POST /api/v1/internal/beans/validate

### 18.1 목적

운영자가 입력한 원두 데이터가 데이터 명세와 검증 규칙을 만족하는지 확인한다.

MVP에서 관리자 웹 화면은 만들지 않지만, seed 파일 검증 스크립트 또는 내부 도구가 이 API와 같은 검증 규칙을 사용해야 한다.

### 18.2 Request

```http
POST /api/v1/internal/beans/validate
Content-Type: application/json
```

```json
{
  "beans": [
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
      "roast_level": "light",
      "tasting_notes": ["berry", "floral"],
      "taste_profile": {
        "acidity": 4,
        "sweetness": 4,
        "bitterness": 1,
        "body": 2
      },
      "recommended_brew_methods": ["hand_drip"],
      "primary_package": {
        "price": 18000,
        "weight_g": 200,
        "product_url": "https://example.com/products/ethiopia-yirgacheffe"
      },
      "flags": {
        "is_decaf": false,
        "is_available": true
      },
      "source": {
        "type": "operator_tagging",
        "name": "운영자 입력",
        "url": null,
        "last_checked_at": "2026-05-08"
      }
    }
  ]
}
```

### 18.3 Response

```json
{
  "data": {
    "valid": false,
    "summary": {
      "total": 1,
      "valid_count": 0,
      "invalid_count": 1,
      "warning_count": 1
    },
    "results": [
      {
        "id": "bean_sample_ethiopia_yirgacheffe_001",
        "valid": false,
        "errors": [
          {
            "field": "primary_package.currency",
            "message": "currency는 필수입니다."
          }
        ],
        "warnings": [
          {
            "field": "primary_package.price_per_100g",
            "message": "price와 weight_g 기준으로 9000이 계산됩니다."
          }
        ],
        "computed": {
          "price_per_100g": 9000,
          "easy_taste_tags": ["산미 있음", "과일향", "꽃향", "가벼움"]
        }
      }
    ]
  },
  "meta": {
    "request_id": "req_abc123"
  }
}
```

### 18.4 동작 규칙

- 검증 API는 데이터를 저장하지 않는다.
- 필수 필드 누락, enum 오류, 중복 id는 error로 반환한다.
- 오래된 `last_checked_at`, 비정상 가격 범위는 warning으로 반환한다.
- 계산 가능한 파생값은 `computed`에 포함한다.

### 18.5 오류

| HTTP | code | 조건 |
| --- | --- | --- |
| 400 | INVALID_BODY | beans 배열 누락 |
| 422 | VALIDATION_FAILED | 요청 형식 자체가 검증 불가능함 |

## 19. 화면별 API 매핑

| 화면 | API |
| --- | --- |
| SC-001 홈 | `GET /api/v1/home`, `GET /api/v1/categories`, `GET /api/v1/rankings` |
| SC-002 검색 결과 | `GET /api/v1/beans/search`, `GET /api/v1/filter-options`, `POST /api/v1/events` |
| SC-003 원두 상세 | `GET /api/v1/beans/{beanId}`, `GET /api/v1/beans/{beanId}/similar`, `POST /api/v1/events` |
| SC-004 원두 비교 | `GET /api/v1/beans/batch`, `POST /api/v1/events` |
| SC-005 카테고리 | `GET /api/v1/categories/{categoryKey}/beans`, `GET /api/v1/filter-options`, `POST /api/v1/events` |
| SC-006 랭킹 | `GET /api/v1/rankings/{rankingKey}/beans`, `POST /api/v1/events` |

## 20. 캐싱 정책

### 20.1 권장 캐시

| API | 캐시 권장 | 이유 |
| --- | --- | --- |
| `GET /api/v1/home` | 10분 | 자주 바뀌지 않음 |
| `GET /api/v1/categories` | 1시간 | 운영 데이터 |
| `GET /api/v1/rankings` | 1시간 | 운영 데이터 |
| `GET /api/v1/filter-options` | 10분 | 데이터 변경 빈도 낮음 |
| `GET /api/v1/beans/{beanId}` | 10분 | 가격 갱신 주기 낮음 |
| `GET /api/v1/beans/search` | 짧은 캐시 또는 없음 | 쿼리 조합 다양 |
| `POST /api/v1/events` | 캐시 없음 | 기록성 요청 |

### 20.2 stale 데이터

원두 응답에는 `source.last_checked_at`을 포함해 사용자가 데이터 확인 시점을 알 수 있게 한다.

## 21. 성능 기준

| API | 목표 응답 시간 |
| --- | --- |
| `GET /api/v1/beans/search` | p95 800ms 이하 |
| `GET /api/v1/beans/{beanId}` | p95 500ms 이하 |
| `GET /api/v1/beans/batch` | p95 500ms 이하 |
| `GET /api/v1/categories/{categoryKey}/beans` | p95 800ms 이하 |
| `GET /api/v1/rankings/{rankingKey}/beans` | p95 800ms 이하 |

프론트엔드 화면 기준 목표는 검색 결과 첫 화면 2초 이내 표시다.

## 22. 보안과 개인정보

- 사용자-facing API는 개인정보를 요청하지 않는다.
- 이벤트의 `session_id`는 익명 값만 사용한다.
- 이벤트 properties에 이메일, 전화번호, 주소 등 개인정보를 저장하지 않는다.
- 외부 URL은 저장 전 URL 형식을 검증한다.
- 내부 검증 API는 실제 구현 시 인증을 요구해야 한다.

## 23. API 수용 기준

### 23.1 검색

Given 원두 데이터가 1개 이상 등록되어 있다.  
When 사용자가 `GET /api/v1/beans/search?q=라떼`를 호출한다.  
Then 응답은 200이다.  
And `data`는 BeanCard 배열이다.  
And `meta.pagination`이 포함된다.

### 23.2 필터

Given 산미가 낮은 원두와 높은 원두가 등록되어 있다.  
When 사용자가 `GET /api/v1/beans/search?acidity=low`를 호출한다.  
Then 산미 점수 1-2인 원두만 반환된다.

### 23.3 상세

Given 유효한 bean_id가 있다.  
When 사용자가 `GET /api/v1/beans/{beanId}`를 호출한다.  
Then 응답은 200이다.  
And `data.package.price_per_100g`이 포함된다.

### 23.4 비교

Given 비교함에 원두 ID 3개가 있다.  
When 사용자가 `GET /api/v1/beans/batch?ids=a,b,c`를 호출한다.  
Then 요청한 순서대로 최대 3개 원두가 반환된다.

### 23.5 이벤트

Given 사용자가 판매처 이동 버튼을 클릭한다.  
When 프론트엔드가 `POST /api/v1/events`에 `outbound_clicked`를 보낸다.  
Then 응답은 200이다.  
And 이벤트는 화면 동작을 막지 않는다.

## 24. 구현 전 확인 사항

개발 시작 전 결정해야 할 항목:

- API 서버를 별도로 둘지, 정적 JSON 기반으로 시작할지
- 검색을 서버에서 처리할지, 초기 MVP에서 클라이언트에서 처리할지
- 원두 상세 URL에 `id`와 `slug` 중 무엇을 사용할지
- 이벤트 로깅 저장소를 무엇으로 할지
- `filter-options`에서 count를 제공할지 여부
- 내부 검증 API를 실제 endpoint로 만들지, 스크립트로만 둘지

## 25. 다음 문서로 넘길 내용

다음 문서에서 구체화할 내용:

- `TECHNICAL_DESIGN.md`: 아키텍처, 저장소, 검색 구현, 배포 구조
- `TEST_PLAN.md`: API별 테스트 케이스, 오류 케이스, QA 체크리스트
- `IMPLEMENTATION_PLAN.md`: API와 화면 구현 작업 단위 분해
