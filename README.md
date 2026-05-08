# Bean Finder

Bean Finder는 커피 원두의 맛, 특징, 가격을 비교해 사용자가 취향과 예산에 맞는 원두를 찾도록 돕는 커피 원두 검색 엔진입니다.

현재 저장소는 기획 문서와 Vite + React + TypeScript 기반 MVP 앱 skeleton을 포함합니다. M0 프로젝트 기반 준비가 완료되어 로컬 개발 서버, 라우팅 placeholder, 타입 검사, lint, 단위 테스트, 빌드 명령을 실행할 수 있습니다.

## Quick Start

```bash
npm install
npm run dev
```

검증 명령:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Product Goal

사용자는 다음 기준으로 원두를 탐색할 수 있어야 합니다.

- 산미, 바디감, 단맛, 쓴맛
- 컵노트
- 로스팅 정도
- 원산지
- 추출 방식
- 가격과 100g당 가격
- 카테고리와 랭킹
- 최대 4개 원두 비교

## MVP Scope

MVP에 포함합니다.

- 홈
- 검색 결과
- 필터와 정렬
- 원두 상세
- 원두 비교
- 카테고리
- 랭킹
- 판매처 이동
- JSON 기반 데이터
- 데이터 검증

MVP에서 제외합니다.

- 회원가입
- 로그인
- 자체 결제
- 사용자 리뷰
- 찜 목록 서버 저장
- 관리자 웹 화면
- 자동 크롤링
- 운영 DB
- 검색엔진

## Technical Direction

초기 MVP는 다음 구조를 기본으로 합니다.

```text
Frontend App
  -> Internal API or Serverless API
  -> Service Layer
  -> JSON Data Store
```

핵심 결정:

- 데이터는 초기에는 JSON으로 관리합니다.
- 검색, 필터, 정렬은 인메모리로 처리합니다.
- 비교함은 `localStorage`에 저장합니다.
- `/api/v1/*` API contract는 유지합니다.
- 추후 운영 DB와 검색엔진으로 전환할 수 있게 service/repository 계층을 분리합니다.

## Documentation

| 문서 | 목적 |
| --- | --- |
| [PRD.md](./docs/PRD.md) | 제품 목표, 사용자, MVP 범위 |
| [FUNCTIONAL_SPEC.md](./docs/FUNCTIONAL_SPEC.md) | 기능별 동작 규칙과 수용 기준 |
| [SCREEN_SPEC.md](./docs/SCREEN_SPEC.md) | 화면 구조, 상태, 액션 |
| [DATA_SPEC.md](./docs/DATA_SPEC.md) | 데이터 모델, enum, 검증 규칙 |
| [API_SPEC.md](./docs/API_SPEC.md) | API 요청/응답과 오류 형식 |
| [TECHNICAL_DESIGN.md](./docs/TECHNICAL_DESIGN.md) | 기술 구조, 검색, 배포, 확장 전략 |
| [TEST_PLAN.md](./docs/TEST_PLAN.md) | 테스트 범위와 QA 기준 |
| [IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md) | 마일스톤과 개발 작업 단위 |
| [IMPLEMENTATION_CHECKLIST.md](./docs/IMPLEMENTATION_CHECKLIST.md) | 구현 진행 현황 추적 체크리스트 |
| [RELEASE_PLAN.md](./docs/RELEASE_PLAN.md) | 배포, QA 승인, 롤백, 모니터링 |
| [DATA_ENTRY_GUIDE.md](./docs/DATA_ENTRY_GUIDE.md) | 원두 데이터 입력 기준 |
| [TAGGING_GUIDE.md](./docs/TAGGING_GUIDE.md) | 맛 점수와 컵노트 태깅 기준 |

## Recommended Build Order

1. 프로젝트 생성과 라우트 skeleton
2. 데이터 타입과 샘플 JSON 작성
3. 데이터 검증과 파생값 계산
4. 검색, 필터, 정렬 service 작성
5. API contract 구현
6. 홈과 검색 결과 화면 구현
7. 상세 화면 구현
8. 비교함과 비교 화면 구현
9. 카테고리와 랭킹 구현
10. 이벤트, 오류 상태, 접근성 보강
11. 테스트 자동화
12. staging 배포와 QA

## Scripts

현재 제공하는 명령:

```text
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
```

향후 M1 이후 `npm run validate:data`, M3 이후 API 테스트, M7 이후 E2E 테스트를 추가합니다.

## Data Workflow

초기 데이터는 운영자가 수작업으로 입력합니다.

권장 흐름:

```text
로스터리 공식 정보 확인
  -> 원두 기본 정보 입력
  -> 가격과 용량 입력
  -> 맛 점수 태깅
  -> 컵노트 표준 태그 매핑
  -> 데이터 검증
  -> staging QA
  -> production 반영
```

데이터 입력 기준은 [DATA_ENTRY_GUIDE.md](./docs/DATA_ENTRY_GUIDE.md), 맛 점수와 컵노트 기준은 [TAGGING_GUIDE.md](./docs/TAGGING_GUIDE.md)를 따릅니다.

## Release Readiness

MVP 베타 출시 전 최소 기준:

- 데이터 검증 통과
- 검색, 필터, 정렬 동작
- 상세와 비교 화면 동작
- 가격과 100g당 가격 정확도 확인
- 모바일, 태블릿, 데스크톱 QA 완료
- 핵심 E2E 통과
- staging smoke test 통과
- 출시 차단 이슈 0개

## Open Decisions

구현 시작 전 확정해야 할 항목:

- 프론트엔드 프레임워크
- CSS 방식
- 배포 플랫폼
- JSON 데이터 파일 위치
- 데이터 검증 라이브러리
- 이벤트 로깅 저장소
- 내부 검증을 CLI로 할지 API로 할지
