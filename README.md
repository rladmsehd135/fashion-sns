# Fashion SNS — 패션 소셜 네트워크 서비스

> AI 기반 코디 추천과 실시간 커뮤니티를 결합한 패션 특화 SNS 플랫폼

---

## 프로젝트 소개

**Fashion SNS**는 패션 애호가들을 위한 풀스택 소셜 네트워킹 플랫폼입니다.  
사용자는 자신의 코디(OOTD)를 공유하고, AI 기반 스타일 추천을 받고, 실시간 채팅과 1:1 패션 배틀 투표를 통해 커뮤니티와 소통할 수 있습니다.

---

## 주요 기능

| 카테고리 | 기능 |
|---|---|
| 인증 | 이메일 회원가입/로그인, 카카오·구글 소셜 로그인, 이메일 인증, JWT 토큰 관리 |
| 피드 | OOTD 게시물 작성(다중 이미지), 아이템 태그, 스타일 해시태그, 좋아요·댓글·북마크 |
| AI 코디 | Google Gemini 기반 코디 완성 추천, 체형별 핏 리뷰, 월별 스타일 타임라인 분석 |
| 실시간 채팅 | 1:1 DM, 그룹 채팅, 채팅 요청 시스템, 타이핑 인디케이터, 비속어 필터링 |
| 스토리 | 24시간 만료 스토리, 스토리 반응·댓글·유저 태그, 조회수 추적 |
| 패션 배틀 | 두 코디를 비교 투표하는 1:1 배틀 시스템 |
| 랭킹 | 브랜드·아이템·스타일 트렌드 랭킹 (전체/주간/월간) |
| 프로필 | OOTD 캘린더, 스타일 선호도, 팔로우/팔로잉, 스타일 분석 리포트 |

---

## 기술 스택

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 5
- **Database**: Oracle Database (oracledb, 커넥션 풀링)
- **실시간 통신**: Socket.io 4
- **인증**: JWT (Access/Refresh Token), Passport.js (Kakao OAuth 2.0, Google OAuth 2.0)
- **AI**: Google Generative AI SDK (Gemini 2.0 Flash)
- **이미지 처리**: Multer, Sharp
- **이메일**: Nodemailer (Gmail SMTP)
- **보안**: bcryptjs (비밀번호 해싱)

### Frontend
- **Framework**: React 19 + Vite
- **UI Library**: Material-UI (MUI) v9, Emotion
- **상태 관리**: Zustand
- **라우팅**: React Router DOM v7
- **HTTP 클라이언트**: Axios
- **실시간**: Socket.io-client
- **날짜 처리**: date-fns

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────┐
│              Client (React)             │
│   Zustand │ MUI │ Socket.io-client      │
└──────────────────┬──────────────────────┘
                   │ HTTP / WebSocket
┌──────────────────▼──────────────────────┐
│          Server (Express.js)            │
│  Auth │ Posts │ Chat │ AI │ Stories     │
│  Passport.js │ JWT │ Multer │ Sharp     │
│  Socket.io (실시간 이벤트 처리)          │
└─────────────┬───────────────┬───────────┘
              │               │
   ┌──────────▼───┐   ┌───────▼────────┐
   │ Oracle DB    │   │ Google Gemini  │
   │ (커넥션 풀링) │   │ AI API         │
   └──────────────┘   └────────────────┘
```

---

## 프로젝트 구조

```
fashion-sns/
├── server/
│   ├── config/          # DB, JWT, Passport 설정
│   ├── controllers/     # 비즈니스 로직
│   ├── routes/          # API 엔드포인트 정의
│   ├── middlewares/     # JWT 인증, 파일 업로드, 에러 핸들러
│   ├── utils/           # AI 서비스, 추천 알고리즘, 메일 발송
│   ├── uploads/         # 업로드 이미지 저장소
│   ├── app.js           # Express 앱 설정
│   └── server.js        # 서버 엔트리포인트 + Socket.io
│
└── client/
    └── src/
        ├── pages/       # Feed, Explore, Post, Profile, Chat, Ranking, AI, Auth
        ├── components/  # layout, post, chat, user, common
        ├── api/         # Axios 인스턴스 및 API 모듈
        ├── store/       # Zustand 전역 상태 (auth, theme)
        ├── hooks/       # 커스텀 훅
        └── router/      # AppRouter (라우트 정의)
```

---

## 주요 구현 포인트

### 1. JWT 이중 토큰 인증
Access Token + Refresh Token 구조로 보안성과 사용자 편의성을 동시에 확보하였습니다. 토큰 만료 시 자동 갱신 로직을 Axios 인터셉터에 구현했습니다.

### 2. 실시간 통신 (Socket.io)
채팅 메시지, 타이핑 인디케이터, 온/오프라인 상태, 알림을 Socket.io로 처리합니다. 그룹 채팅의 읽지 않은 메시지 수를 소켓 이벤트 기반으로 실시간 업데이트합니다.

### 3. Google Gemini AI 연동
업로드된 아이템 이미지를 Gemini 2.0 Flash 모델에 전달하여 코디 완성 추천, 색상 팔레트, 계절 제안, 스타일링 팁을 생성합니다. 스트리밍 응답 파싱을 통해 빠른 응답 속도를 구현했습니다.

### 4. 이미지 최적화 파이프라인
Sharp 라이브러리를 활용하여 업로드 시 자동으로 이미지를 리사이징·압축 처리합니다. 다중 이미지 업로드 순서를 DB에 저장하여 게시물 표시 순서를 보장합니다.

### 5. Oracle DB 커넥션 풀링
oracledb의 커넥션 풀을 설정하여 동시 요청에서 DB 연결 자원을 효율적으로 관리합니다. CLOB 타입으로 장문 게시물 저장, Oracle FETCH FIRST/NEXT 구문으로 커서 기반 페이지네이션을 구현했습니다.

### 6. 소셜 로그인 (OAuth 2.0)
Passport.js를 활용하여 카카오, 구글 소셜 로그인을 통합 구현했습니다. 신규 유저는 자동 회원가입, 기존 유저는 바로 로그인 처리됩니다.

### 7. 비속어 필터링
채팅 메시지 전송 전 서버 사이드에서 한국어 비속어를 감지하고 필터링하여 커뮤니티 안전성을 확보했습니다.

---

## API 엔드포인트 구조

| 모듈 | 경로 | 주요 기능 |
|---|---|---|
| 인증 | `/api/auth` | 회원가입, 로그인, OAuth 콜백, 이메일 인증, 토큰 갱신 |
| 게시물 | `/api/posts` | 피드, 탐색, CRUD, 좋아요, 배틀, 추천 |
| 유저 | `/api/users` | 프로필, 수정, 스타일 선호도, 차단, 신고 |
| 채팅 | `/api/chat` | 채팅방, 메시지, 채팅 요청, 그룹 |
| 스토리 | `/api/stories` | 목록, 생성, 삭제, 반응, 태그 |
| 랭킹 | `/api/ranking` | 브랜드/아이템/스타일 트렌드 |
| AI | `/api/ai` | 코디 추천, 스타일 타임라인, 체형별 핏 리뷰 |
| 알림 | `/api/notifications` | 알림 목록, 읽음 처리 |
| 북마크 | `/api/bookmarks` | 저장, 삭제, 목록 |

---

## 실행 방법

### 사전 요구사항
- Node.js 18+
- Oracle Database (XE 이상)
- Google Gemini API Key
- Kakao / Google OAuth 앱 등록

### 환경 변수 설정 (`server/.env`)
```env
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_CONNECTSTRING=localhost/xe
JWT_SECRET=your_jwt_secret
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GEMINI_API_KEY=your_gemini_api_key
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
```

### 서버 실행
```bash
cd server
npm install
npm run dev
```

### 클라이언트 실행
```bash
cd client
npm install
npm run dev
```

---

## 데이터베이스 주요 테이블

| 테이블 | 설명 |
|---|---|
| `users` | 사용자 계정 및 프로필 (키, 몸무게, 스타일 아키타입 포함) |
| `posts` | 코디 게시물 (스타일 태그, 다중 이미지) |
| `post_items` | 게시물에 첨부된 아이템 정보 (브랜드, 카테고리, 가격, 핏 리뷰, 별점) |
| `chat_rooms` / `chat_messages` | 1:1·그룹 채팅 룸 및 메시지 |
| `stories` | 24시간 만료 스토리 |
| `follows` | 팔로우 관계 |
| `notifications` | 좋아요·댓글·팔로우·태그 알림 |
| `user_style_prefs` | 유저 스타일 선호도 점수 |

---

## 개발 기간 및 인원

- **개발 기간**: 2026년 상반기
- **개발 인원**: 개인 프로젝트

---

## 트러블슈팅 & 배운 점

- **Oracle CLOB + JSON 직렬화 이슈**: CLOB 컬럼 데이터를 JSON 응답에 포함할 때 직렬화 오류가 발생하여, 조회 시 `TO_CHAR()` 변환 및 응답 전 명시적 문자열 변환으로 해결
- **Socket.io 멀티룸 동기화**: 그룹 채팅에서 읽지 않은 메시지 수가 실시간으로 동기화되지 않는 문제를 소켓 룸 구조와 이벤트 전파 방식을 재설계하여 해결
- **Gemini 스트리밍 파싱**: AI 응답이 JSON 형식으로 스트리밍될 때 청크 단위 파싱 오류가 발생하여, 전체 스트림 수집 후 파싱하는 방식으로 안정성 확보
- **Sharp + Multer 파이프라인**: 메모리 버퍼와 디스크 저장 사이의 경합 조건을 해결하기 위해 Multer 메모리 스토리지 → Sharp 변환 → 디스크 저장 순서로 파이프라인 정리

---

## License

MIT
