# 대량 엑셀 Import/Export 단계별 작업 계획

## 1. 요구사항·스키마 정리
- 보드 단위로 컬럼/카드 전체를 엑셀로 내보내기·가져오기.
- 공통 스키마 정의: 컬럼명/순서, 카드 제목/순서, 설명, 라벨, 담당자, 마감일(UTC ISO8601), 체크리스트 등. 멀티값은 `;` 구분자.
- 템플릿 다운로드로 동일 스키마 보장.

## 2. 백엔드 설계 (Spring Boot)
- Export API: `GET /api/boards/{id}/excel/export` → SXSSF 기반 스트리밍 생성, `Content-Type` XLSX, 큰 데이터도 OOM 없이 처리. 에러 시 표준 오류 응답.
- Template API: `GET /api/boards/{id}/excel/template` → 헤더만 있는 샘플 파일 제공.
- Import API: `POST /api/boards/{id}/excel/import?mode=merge|overwrite` → 파일 업로드 후 즉시 `202 Accepted` + `jobId` 반환.
- 비동기 처리 워커: 임시 파일을 SAX 파서로 읽어 청크 배치 upsert, 트랜잭션 범위는 청크 단위. 진행률/완료/실패 이벤트를 발행.
- 상태/결과 조회: `GET /api/import/{jobId}/status`(폴링), 완료 결과(성공/실패 건수, 실패 행 리스트) 반환. 실패 행은 행 번호+메시지 포함.
- WebSocket(STOMP) 알림: `/topic/boards/{id}/import/{jobId}` 채널로 진행률(%)와 완료 이벤트 전송. 저빈도(0.5~1초) 발행으로 부하 제한.
- 보안/검증: 권한 검사, 파일 타입/크기 제한, 파싱 에러 처리, 라벨/사용자 매핑 실패 시 행 단위 오류 기록.

## 3. 프론트엔드 설계 (BoardHeader 버튼 추가)
- UI: BoardHeader에 “엑셀” 버튼(드롭다운) 추가 → 메뉴: 템플릿 다운로드, 내보내기, 가져오기.
- Export: 클릭 시 `GET /excel/export` 호출 후 파일 다운로드 처리, 로딩 스피너/토스트 표기.
- Import: 파일 선택 + 모드(덮어쓰기/병합) 선택 → 업로드. 업로드 성공 시 “처리 중” 배너/모달 띄우고 진행률 바 표시.
- WebSocket 구독: `jobId` 기반 채널 구독 후 진행률/완료 이벤트로 UI 갱신. 연결 실패 시 폴링(`/status`) 대체.
- 결과 표시: 완료 시 성공/실패 요약, 실패 행 CSV/XLS 재다운로드 옵션 제공.
- 클라이언트 검증: Web Worker로 헤더 필수값/행 수 검증, 10–20MB 이상 시 예상 시간 안내.

## 4. 성능·신뢰성 대응
- 서버: 스트리밍 읽기/쓰기, 배치 upsert, 적절한 인덱스 확인, 청크별 커밋으로 긴 트랜잭션 방지.
- 클라이언트: 업로드 진행률(가능 시 Content-Length 기반), WebSocket 백오프·재연결, 폴링 백업.
- 타임아웃/재시도 정책 정의, 대량 파일(예: 50k+ 카드)로 프로파일링.

## 5. 테스트 계획
- 단위: 파서/직렬화, 날짜·라벨 매핑, 중복·순서 처리.
- 통합: 실제 엑셀 업/다운로드 E2E(merge/overwrite, 부분 실패).
- 성능: 대용량 파일로 처리 시간·메모리 측정, WebSocket 이벤트 빈도 검증.
