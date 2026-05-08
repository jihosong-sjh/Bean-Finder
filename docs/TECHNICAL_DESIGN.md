# 커피 원두 검색 엔진 기술 설계서

문서 버전: v0.1  
작성일: 2026-05-08  
제품명: Bean Finder, 가칭  
연관 문서: [PRD.md](./PRD.md), [FUNCTIONAL_SPEC.md](./FUNCTIONAL_SPEC.md), [SCREEN_SPEC.md](./SCREEN_SPEC.md), [DATA_SPEC.md](./DATA_SPEC.md), [API_SPEC.md](./API_SPEC.md)  
문서 목적: Bean Finder MVP의 시스템 구조, 데이터 저장 방식, 검색 구현, 화면-API 연동, 이벤트 로깅, 배포와 확장 전략을 정의한다.

## 1. 범위

이 문서는 MVP를 구현하기 위한 기술 설계를 다룬다.

포함 범위:

- 프론트엔드 구조
- API 계층
- 데이터 저장 방식
- 검색, 필터, 정렬 구현
- 원두 상세와 비교 기능 구현
- 카테고리와 랭킹 계산
- 이벤트 로깅
- 데이터 검증
- 캐싱
- 배포
- 확장 전략

제외 범위:

- 회원 시스템
- 자체 결제
- 관리자 웹 화면
- 자동 크롤링 시스템
- 모바일 네이티브 앱
- 개인화 추천 시스템

## 2. 핵심 결정

MVP 기본 기술 방향은 다음과 같다.

| 항목 | 결정 |
| --- | --- |
| 앱 형태 | 반응형 웹 애플리케이션 |
| 데이터 저장 | 초기에는 정적 JSON 파일 |
| API 방식 | 앱 내부 API 또는 서버 함수 |
| 검색 구현 | 초기에는 인메모리 검색과 필터링 |
| 비교함 | 클라이언트 localStorage |
| 이벤트 로깅 | 초기에는 서버 endpoint 또는 외부 분석 도구로 추상화 |
| 이미지 | 외부 이미지 URL 우선, 없으면 기본 이미지 |
| 배포 | 정적/서버리스 배포 가능한 구조 |
| DB 도입 시점 | 원두 500개 이상 또는 운영자 갱신 빈도 증가 시 |
| 검색엔진 도입 시점 | 검색 품질 또는 속도가 인메모리 방식 한계를 넘을 때 |

## 3. 권장 기술 스택

아직 실제 구현 스택이 확정되지 않았으므로 MVP 권장안을 정의한다.

### 3.1 기본안

| 영역 | 권장 |
| --- | --- |
| 언어 | TypeScript |
| 프론트엔드 | React 기반 프레임워크 |
| 라우팅 | 파일 기반 또는 선언형 라우팅 |
| 스타일링 | CSS Modules, Tailwind CSS, 또는 프로젝트 표준 CSS |
| 데이터 파일 | JSON |
| 데이터 검증 | Zod, Valibot, 또는 JSON Schema |
| 테스트 | Vitest/Jest, Playwright |
| 배포 | Vercel, Netlify, 또는 일반 Node 서버 |

### 3.2 선택 이유

- TypeScript는 데이터 명세와 API 응답 타입을 일관되게 관리하기 좋다.
- 정적 JSON은 초기 데이터 수집과 수정이 빠르다.
- 앱 내부 API는 프론트엔드와 API 명세를 동시에 검증하기 쉽다.
- 검색엔진 없이도 300-500개 수준의 원두는 충분히 빠르게 필터링할 수 있다.
- 추후 DB와 검색엔진으로 전환할 때 API contract를 유지할 수 있다.

## 4. 시스템 아키텍처

### 4.1 MVP 구조

```text
Browser
  |
  | HTTP
  v
Web App
  |
  | Internal API
  v
Application Service Layer
  |
  | read
  v
JSON Data Store
  |
  | build-time or runtime validation
  v
Validation Layer
```

### 4.2 주요 계층

| 계층 | 책임 |
| --- | --- |
| UI Layer | 화면 렌더링, 입력, 상태 표시 |
| Client State Layer | 검색 조건, 비교함, UI 상태 관리 |
| API Layer | 명세 기반 요청/응답 제공 |
| Service Layer | 검색, 필터, 정렬, 추천 점수, 유사도 계산 |
| Repository Layer | JSON 또는 DB에서 데이터 조회 |
| Validation Layer | 원두 데이터 구조와 값 검증 |
| Event Layer | 사용자 행동 이벤트 기록 |

### 4.3 향후 확장 구조

```text
Browser
  |
  v
Web App
  |
  v
API Server
  |
  +--> Relational DB
  |
  +--> Search Index
  |
  +--> Event Store
  |
  +--> Cache
```

MVP에서 API contract를 유지하면 저장소를 JSON에서 DB로 바꾸더라도 프론트엔드 변경을 최소화할 수 있다.

## 5. 디렉터리 구조 제안

구현 시 권장 구조:

```text
src/
  app/
    routes/
      home/
      search/
      beans/
      compare/
      categories/
      rankings/
    api/
      v1/
  components/
    layout/
    search/
    filters/
    beans/
    compare/
    rankings/
  features/
    beans/
      bean.types.ts
      bean.repository.ts
      bean.service.ts
      bean.mapper.ts
      bean.validation.ts
    search/
      search.types.ts
      search.service.ts
      search.scoring.ts
    categories/
    rankings/
    events/
  data/
    beans.json
    roasteries.json
    tasting_notes.json
    categories.json
    rankings.json
  lib/
    formatting/
    url/
    storage/
    errors/
  tests/
    unit/
    integration/
    e2e/
```

실제 프레임워크에 따라 `app`, `routes`, `api` 위치는 달라질 수 있지만, `features` 내부 책임 분리는 유지한다.

## 6. 데이터 저장 설계

### 6.1 MVP 저장소

초기 데이터는 JSON 파일로 관리한다.

```text
data/
  beans.json
  roasteries.json
  tasting_notes.json
  categories.json
  rankings.json
```

데이터 로딩 시점:

- 개발 환경: 런타임 로딩 가능
- 배포 환경: 빌드 타임 로딩 또는 서버 함수 런타임 로딩

### 6.2 데이터 로딩 흐름

```text
JSON 파일
  -> schema validation
  -> derived fields 계산
  -> in-memory collection 생성
  -> API/service에서 조회
```

### 6.3 파생 데이터 계산

서비스 시작 또는 빌드 시 다음 값을 계산한다.

- `price_per_100g`
- `easy_taste_tags`
- `search_text`
- `data_completeness_score`
- 카테고리 membership
- 랭킹 정렬 결과, 선택적 캐시

### 6.4 DB 전환 기준

다음 조건 중 2개 이상 충족하면 DB 전환을 검토한다.

- 원두 데이터가 500개를 넘는다.
- 가격과 판매 상태를 주 1회 이상 갱신한다.
- 운영자가 개발자 도움 없이 데이터를 수정해야 한다.
- 로스터리별 관리 화면이 필요하다.
- 가격 이력 또는 변경 이력을 저장해야 한다.

### 6.5 DB 전환 후보

| 선택지 | 장점 | 단점 |
| --- | --- | --- |
| PostgreSQL | 관계형 데이터, 검색 확장, 운영 안정성 | 초기 설정 필요 |
| SQLite | 간단한 로컬 개발과 배포 | 동시 운영과 확장 한계 |
| Supabase | 빠른 관리자/DB/API 구성 | 외부 서비스 의존 |

MVP 이후 운영형 서비스로 전환할 경우 PostgreSQL을 기본 후보로 둔다.

## 7. 데이터 검증 설계

### 7.1 검증 시점

| 시점 | 목적 |
| --- | --- |
| 개발 중 seed 검증 | 잘못된 데이터가 커밋되지 않도록 방지 |
| 빌드 시 검증 | 배포 실패를 통해 사용자 영향 차단 |
| 내부 검증 API | 운영 입력 데이터 사전 검증 |
| 런타임 방어 | 예상치 못한 누락 데이터로 화면이 깨지는 것 방지 |

### 7.2 검증 대상

- 필수 필드 존재 여부
- enum 허용 값
- 점수 범위 1-5
- URL 형식
- 가격과 용량 범위
- 중복 ID
- 로스터리 참조 무결성
- 컵노트 참조 무결성
- 날짜 형식과 미래 날짜 여부

### 7.3 검증 실패 처리

| 상황 | 처리 |
| --- | --- |
| 개발 seed 검증 실패 | 테스트 실패 |
| 빌드 시 검증 실패 | 빌드 실패 |
| 내부 검증 API 실패 | error 목록 반환 |
| 선택 필드 누락 | warning 또는 `null` 허용 |
| 비정상 가격 범위 | warning 반환, 운영자 확인 |

## 8. 검색 설계

### 8.1 MVP 검색 방식

초기에는 JSON 데이터에서 생성한 인메모리 컬렉션을 대상으로 검색한다.

검색 단계:

```text
query 정규화
  -> 의도/조건 매핑
  -> search_text 매칭
  -> 필터 적용
  -> 추천 점수 계산
  -> 정렬
  -> 페이지네이션
  -> BeanCard 변환
```

### 8.2 검색어 정규화

처리 규칙:

- 앞뒤 공백 제거
- 중복 공백 제거
- 영문 소문자 변환
- 금액 표현 파싱
- 쉬운 맛 표현 매핑

예시:

| 검색어 | 해석 |
| --- | --- |
| 신맛 적은 원두 | acidity low |
| 산미 있는 원두 | acidity high |
| 라떼 원두 | brew_method latte 또는 espresso |
| 묵직한 원두 | body heavy |
| 2만원 이하 | price_max 20000 |
| 초콜릿 향 | tasting_notes chocolate group |

### 8.3 검색 점수

검색어가 있는 경우 다음 가중치를 사용한다.

| 일치 항목 | 가중치 |
| --- | --- |
| 원두명 직접 일치 | 100 |
| 로스터리명 직접 일치 | 90 |
| 컵노트 일치 | 70 |
| 쉬운 맛 표현 일치 | 65 |
| 원산지 일치 | 55 |
| 추출 방식 일치 | 50 |
| 로스팅 일치 | 40 |
| search_text 부분 일치 | 20 |

### 8.4 필터 적용

필터 규칙:

- 서로 다른 필터 그룹은 AND
- 같은 필터 그룹의 복수 선택은 OR
- 기본 판매 상태는 `available_only`
- 품절 포함은 사용자가 명시한 경우에만 적용

### 8.5 정렬

정렬은 API 명세의 `sort_key`를 따른다.

추천순은 다음 항목을 사용한다.

- 검색/맛 조건 일치도
- 가격 적합도
- 데이터 완성도
- 평점
- 리뷰 수

평점과 리뷰 수가 없으면 맛 조건, 가격, 데이터 완성도만 사용한다.

### 8.6 검색엔진 전환 기준

다음 조건 중 하나라도 충족하면 검색엔진 도입을 검토한다.

- 원두 데이터가 5,000개 이상으로 늘어난다.
- 동의어, 오타 보정, 초성 검색 요구가 강해진다.
- 검색 p95 응답 시간이 800ms를 넘는다.
- 검색 랭킹 실험이 자주 필요하다.

후보:

| 선택지 | 장점 | 단점 |
| --- | --- | --- |
| PostgreSQL full-text search | DB와 통합 쉬움 | 한국어 형태소 처리 한계 |
| Meilisearch | 빠른 구축, 오타 허용 | 별도 서버 필요 |
| Elasticsearch/OpenSearch | 강력한 검색 기능 | 운영 복잡도 큼 |

MVP 이후 검색 전용 엔진이 필요하면 Meilisearch를 1차 후보로 둔다.

## 9. API 구현 설계

### 9.1 API Layer 책임

API Layer는 다음만 담당한다.

- 요청 파라미터 파싱
- 입력 검증
- service 호출
- 공통 응답 형식 변환
- 오류 코드 매핑

비즈니스 로직은 service 계층에 둔다.

### 9.2 Service Layer 책임

| Service | 책임 |
| --- | --- |
| BeanService | 상세, batch, 유사 원두 조회 |
| SearchService | 검색, 필터, 정렬, 페이지네이션 |
| CategoryService | 카테고리 메타데이터와 카테고리 조건 적용 |
| RankingService | 랭킹 조건과 정렬 적용 |
| FilterOptionService | 필터 옵션과 count 계산 |
| EventService | 이벤트 검증과 저장 |
| ValidationService | 원두 데이터 검증 |

### 9.3 Repository Layer 책임

Repository는 저장소 구현을 숨긴다.

```text
BeanRepository
  findAll()
  findByIdOrSlug(idOrSlug)
  findByIds(ids)

RoasteryRepository
  findAll()
  findById(id)

CategoryRepository
  findAllActive()
  findByKey(key)

RankingRepository
  findAllActive()
  findByKey(key)
```

JSON에서 DB로 바뀌어도 service 계층의 인터페이스는 유지한다.

## 10. 화면 연동 설계

### 10.1 홈

사용 API:

- `GET /api/v1/home`
- 선택적으로 `GET /api/v1/categories`
- 선택적으로 `GET /api/v1/rankings`

상태:

- 추천 검색어
- 추천 카테고리
- 랭킹 진입 정보

### 10.2 검색 결과

사용 API:

- `GET /api/v1/beans/search`
- `GET /api/v1/filter-options`
- `POST /api/v1/events`

URL 상태:

- 검색어
- 필터
- 정렬
- 페이지

구현 규칙:

- URL이 source of truth다.
- 필터 변경 시 URL을 갱신한다.
- 뒤로 가기 시 이전 검색 조건이 복원되어야 한다.

### 10.3 원두 상세

사용 API:

- `GET /api/v1/beans/{beanId}`
- `GET /api/v1/beans/{beanId}/similar`
- `POST /api/v1/events`

구현 규칙:

- 상세 데이터 로딩 실패 시 데이터 없음 화면을 표시한다.
- 유사 원두 API 실패는 상세 화면 전체 실패로 처리하지 않는다.

### 10.4 비교

사용 API:

- `GET /api/v1/beans/batch`
- `POST /api/v1/events`

상태:

- 비교함 ID 목록은 localStorage에 저장한다.
- 비교 데이터 자체는 API에서 다시 조회한다.

localStorage key:

```text
bean_finder.compare_ids
```

규칙:

- 최대 4개
- 중복 추가 금지
- 존재하지 않는 ID는 batch 응답의 `missing_ids` 기준으로 제거할 수 있다.

## 11. 카테고리와 랭킹 설계

### 11.1 카테고리

카테고리는 저장된 원두 목록이 아니라 조건 기반 view다.

예:

```json
{
  "key": "low-acidity",
  "default_filters": {
    "acidity": "low"
  }
}
```

카테고리 조회 흐름:

```text
categoryKey 조회
  -> default_filters 로드
  -> 사용자 추가 필터 병합
  -> SearchService 호출
  -> 결과 반환
```

### 11.2 랭킹

랭킹은 조건과 정렬 기준을 가진 view다.

예:

```json
{
  "key": "price-per-100g",
  "filters": {
    "is_available": true
  },
  "sort": {
    "field": "price_per_100g",
    "direction": "asc"
  }
}
```

랭킹 조회 흐름:

```text
rankingKey 조회
  -> filters 적용
  -> sort 적용
  -> rank 번호 부여
  -> 결과 반환
```

## 12. 유사 원두 설계

### 12.1 유사도 기준

유사 원두는 다음 점수를 기반으로 계산한다.

```text
similarity_score =
taste_profile_similarity * 0.40
+ tasting_note_overlap * 0.30
+ roast_level_match * 0.20
+ origin_match * 0.10
```

### 12.2 taste_profile_similarity

산미, 단맛, 쓴맛, 바디감의 거리 기반으로 계산한다.

```text
distance =
abs(acidity_a - acidity_b)
+ abs(sweetness_a - sweetness_b)
+ abs(bitterness_a - bitterness_b)
+ abs(body_a - body_b)
```

거리 0에 가까울수록 높은 점수를 준다.

### 12.3 제외 조건

- 기준 원두 자신
- 필수 데이터가 누락된 원두
- 판매 중단 원두, 단 판매 중 원두가 부족하면 후순위 포함 가능

## 13. 이벤트 로깅 설계

### 13.1 이벤트 수집 방식

MVP에서는 이벤트 전송 인터페이스를 먼저 정의하고 저장소는 교체 가능하게 둔다.

```text
UI action
  -> trackEvent()
  -> EventService
  -> event sink
```

event sink 후보:

| 방식 | 장점 | 단점 |
| --- | --- | --- |
| 서버 로그 | 구현 쉬움 | 분석 불편 |
| 파일/DB 저장 | 통제 가능 | 관리 필요 |
| 외부 분석 도구 | 대시보드 빠름 | 외부 의존 |

MVP 기본안은 `trackEvent` 추상화를 만들고, 실제 저장소는 구현 시 선택한다.

### 13.2 실패 처리

- 이벤트 실패는 사용자 동작을 막지 않는다.
- 판매처 이동은 이벤트 요청 실패 여부와 무관하게 진행한다.
- 이벤트 전송은 가능하면 비동기로 처리한다.

### 13.3 개인정보

- 로그인 사용자 ID는 저장하지 않는다.
- 익명 `session_id`만 사용한다.
- 검색어는 저장할 수 있으나 개인정보 필터링 정책을 추후 추가한다.

## 14. 캐싱 설계

### 14.1 서버 캐시

| 대상 | 전략 |
| --- | --- |
| categories | 장기 캐시 가능 |
| rankings metadata | 장기 캐시 가능 |
| home metadata | 짧은 캐시 |
| filter options | 짧은 캐시 |
| bean detail | 짧은 캐시 |
| search results | 쿼리 다양성 때문에 제한적 캐시 |

### 14.2 클라이언트 캐시

권장:

- 검색 결과는 URL 기준으로 짧게 캐시할 수 있다.
- 상세 데이터는 뒤로 가기 UX를 위해 캐시할 수 있다.
- 비교함 ID는 localStorage에 저장한다.

### 14.3 캐시 무효화

JSON 기반 MVP에서는 배포가 곧 캐시 무효화 기준이다.

DB 전환 이후에는 다음 이벤트에서 캐시를 무효화한다.

- 원두 가격 변경
- 판매 상태 변경
- 원두 정보 수정
- 카테고리 조건 수정
- 랭킹 기준 수정

## 15. 오류 처리 설계

### 15.1 API 오류

API 오류는 `API_SPEC.md`의 공통 오류 형식을 따른다.

프론트엔드 처리:

| 오류 | 화면 처리 |
| --- | --- |
| INVALID_QUERY | 필터 입력 오류 표시 |
| NOT_FOUND | 데이터 없음 상태 |
| INTERNAL_ERROR | 재시도 버튼 표시 |
| RATE_LIMITED | 잠시 후 재시도 안내 |

### 15.2 부분 실패

| 상황 | 처리 |
| --- | --- |
| 상세 조회 성공, 유사 원두 실패 | 상세는 표시하고 유사 원두 영역만 숨김 또는 오류 표시 |
| 검색 성공, 필터 옵션 실패 | 검색 결과는 표시하고 필터 count는 생략 |
| 이벤트 전송 실패 | 사용자에게 표시하지 않음 |
| 이미지 로딩 실패 | 기본 이미지 표시 |

## 16. 성능 설계

### 16.1 목표

| 항목 | 목표 |
| --- | --- |
| 검색 결과 첫 화면 | 2초 이내 |
| 검색 API p95 | 800ms 이하 |
| 상세 API p95 | 500ms 이하 |
| batch API p95 | 500ms 이하 |
| 필터 변경 후 결과 갱신 | 1초 이내 |

### 16.2 최적화 전략

- 빌드 시 파생 데이터 생성
- 검색 대상 문자열 사전 계산
- 목록 응답은 BeanCard로 최소화
- 상세 응답은 상세 진입 시에만 조회
- 이미지 lazy loading
- 더 보기 방식으로 20개씩 조회
- 필터 count 계산은 비용이 크면 생략 가능

### 16.3 인메모리 검색 한계

원두 500개 수준에서는 인메모리 검색이 충분하다. 5,000개 이상이 되면 검색엔진 또는 DB 검색으로 전환한다.

## 17. 보안 설계

### 17.1 사용자-facing API

- 개인정보를 입력받지 않는다.
- 외부 판매처 URL은 등록 시 검증한다.
- API는 읽기 중심으로 구성한다.
- 이벤트 API에는 과도한 payload 크기 제한을 둔다.

### 17.2 내부 API

`/api/v1/internal/*` 경로는 실제 구현 시 다음 중 하나가 필요하다.

- 관리자 인증
- 내부 네트워크 제한
- 배포 환경에서 비활성화
- CLI 스크립트로 대체

MVP에서 관리자 웹 화면이 없으면 내부 검증은 CLI 스크립트로 구현하는 것이 더 단순하다.

## 18. 접근성과 프론트엔드 품질

### 18.1 접근성

- 필터 drawer는 열릴 때 포커스를 내부로 이동한다.
- 버튼에는 접근 가능한 이름을 제공한다.
- 맛 점수는 색상만으로 표현하지 않는다.
- 이미지에는 대체 텍스트를 제공한다.
- 키보드로 검색, 필터, 정렬, 비교함 조작이 가능해야 한다.

### 18.2 UI 상태 관리

상태 구분:

- 서버 데이터 상태
- URL 상태
- 임시 UI 상태
- 비교함 localStorage 상태

권장:

- 검색 조건은 URL에 둔다.
- 비교함은 localStorage에 둔다.
- drawer 열림, 탭 선택 등은 컴포넌트 상태로 둔다.

## 19. 테스트 전략

상세 테스트 케이스는 `TEST_PLAN.md`에서 정의한다. 기술 설계 관점의 최소 테스트 범위는 다음과 같다.

### 19.1 단위 테스트

- 가격 정규화
- 쉬운 맛 표현 매핑
- 필터 적용
- 정렬
- 추천 점수 계산
- 유사 원두 점수 계산
- 데이터 검증

### 19.2 통합 테스트

- 검색 API
- 상세 API
- batch API
- 카테고리 API
- 랭킹 API
- 이벤트 API

### 19.3 E2E 테스트

- 검색 후 상세 이동
- 필터 적용
- 정렬 변경
- 비교함 추가/제거
- 판매처 이동 버튼
- 빈 결과 상태

## 20. 배포 설계

### 20.1 MVP 배포

MVP는 정적/서버리스 배포 가능한 구조를 목표로 한다.

배포 흐름:

```text
install dependencies
  -> lint
  -> type check
  -> data validation
  -> test
  -> build
  -> deploy
```

### 20.2 환경 변수

예상 환경 변수:

| 변수 | 설명 | 필수 |
| --- | --- | --- |
| `APP_ENV` | local, staging, production | 필수 |
| `EVENT_SINK` | 이벤트 저장 방식 | 선택 |
| `ANALYTICS_KEY` | 외부 분석 도구 key | 선택 |
| `BASE_URL` | 서비스 기본 URL | 선택 |

MVP에서 외부 분석 도구를 쓰지 않으면 `ANALYTICS_KEY`는 필요 없다.

### 20.3 운영 환경

권장 환경:

- local: 개발자 로컬
- staging: 데이터와 화면 검증
- production: 실제 사용자 공개

## 21. 관측성

### 21.1 로그

기록 대상:

- API 오류
- 데이터 검증 실패
- 이벤트 저장 실패
- 외부 URL 형식 오류

### 21.2 지표

MVP에서 확인할 기술 지표:

- 검색 API 응답 시간
- 상세 API 응답 시간
- 검색 결과 0건 비율
- 이벤트 전송 실패율
- 판매처 이동 이벤트 수
- 데이터 검증 warning 수

### 21.3 알림

MVP에서는 복잡한 알림 시스템은 제외한다. 공개 출시 후 다음 조건에 알림을 붙인다.

- API 오류율 급증
- 검색 API p95 목표 초과
- 빌드 시 데이터 검증 실패
- 이벤트 저장 실패율 증가

## 22. 확장 계획

### 22.1 Phase 1: JSON 기반 MVP

목표:

- 300-500개 원두 데이터
- 검색, 필터, 정렬
- 상세, 비교
- 카테고리, 랭킹
- 이벤트 로깅
- 데이터 검증

### 22.2 Phase 2: DB 도입

목표:

- 원두, 로스터리, 컵노트 테이블화
- 가격과 판매 상태 갱신
- 관리자 입력 프로세스 개선
- 데이터 이력 관리

### 22.3 Phase 3: 검색 고도화

목표:

- 검색 인덱스 도입
- 동의어 사전
- 오타 허용
- 한국어 검색 개선
- 랭킹 실험

### 22.4 Phase 4: 개인화

목표:

- 회원 또는 익명 취향 프로필
- 찜 목록
- 사용자 리뷰
- 개인화 추천
- 가격 알림

## 23. 주요 기술 리스크

| 리스크 | 영향 | 대응 |
| --- | --- | --- |
| JSON 데이터가 커져 검색이 느려짐 | 검색 UX 저하 | DB 또는 검색엔진 전환 기준 마련 |
| 맛 점수 기준이 일관되지 않음 | 추천 품질 저하 | 태깅 가이드와 검증 rule 강화 |
| 가격 정보가 오래됨 | 사용자 신뢰 저하 | last_checked_at 노출, stale 데이터 관리 |
| 이벤트 저장소 미확정 | MVP 지표 확인 지연 | trackEvent 인터페이스를 먼저 구현 |
| 외부 이미지 깨짐 | 화면 품질 저하 | 기본 이미지 fallback |
| 필터 count 계산 비용 증가 | 응답 지연 | count 생략 또는 캐시 |

## 24. 구현 결정 기록

| 결정 | 내용 | 이유 |
| --- | --- | --- |
| ADR-001 | MVP 저장소는 JSON으로 시작 | 초기 데이터 수정과 검증이 빠름 |
| ADR-002 | 비교함은 localStorage에 저장 | 로그인 없는 MVP에 적합 |
| ADR-003 | 카테고리와 랭킹은 조건 기반 view로 계산 | 데이터 중복과 운영 부담 감소 |
| ADR-004 | API contract를 먼저 고정 | 저장소 전환 시 프론트엔드 영향 최소화 |
| ADR-005 | 내부 검증은 API보다 CLI 우선 고려 | 관리자 화면이 없는 MVP에서 더 단순 |

## 25. 구현 전 확인 사항

개발 시작 전 확정해야 할 항목:

- 사용할 프론트엔드 프레임워크
- CSS 방식
- JSON 데이터 파일 위치
- 데이터 검증 라이브러리
- 이벤트 로깅 저장소
- 기본 이미지 제작 방식
- 배포 플랫폼
- 내부 검증을 CLI로 할지 API로 할지

## 26. 다음 문서로 넘길 내용

다음 문서에서 구체화할 내용:

- `TEST_PLAN.md`: 기능, API, 데이터, 화면별 테스트 케이스
- `IMPLEMENTATION_PLAN.md`: 개발 작업 순서와 이슈 단위 분해
- `RELEASE_PLAN.md`: 배포 전 QA, 롤백, 출시 체크리스트
