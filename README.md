<div align="center">

# 👗 FITLOG

**패션 SNS — 코디 공유 · AI 스타일 추천 · 실시간 커뮤니티**

### 👇 아래 배지를 클릭하면 이동합니다

[![코드 리뷰 문서](https://img.shields.io/badge/📝_코드_리뷰_문서_보기-Google_Docs-4285F4?style=for-the-badge&logo=googledocs&logoColor=white)](https://docs.google.com/document/d/1GeO3RuV4dDB54TZ3DyBhU-E9A0YcUBB4/edit)
&nbsp;&nbsp;
[![시연 영상](https://img.shields.io/badge/▶️_시연_영상_보기-Google_Drive-34A853?style=for-the-badge&logo=googledrive&logoColor=white)](https://drive.google.com/drive/folders/1oaEytcE0jzVD3hqHgNq9BROj8nH7tUs_)

<br />

![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Oracle](https://img.shields.io/badge/Oracle_DB-F80000?style=flat-square&logo=oracle&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socketdotio&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_AI-8E75B2?style=flat-square&logo=google&logoColor=white)

</div>

---

## 📖 프로젝트 소개

FITLOG는 사용자가 자신의 코디(OOTD)를 기록하고, 팔로워와 소통하며, AI 기반 스타일 추천까지 받을 수 있는 **패션 특화 SNS**입니다.

단순 게시판을 넘어 **인증 · 피드 · 실시간 채팅 · 스토리 · 랭킹 · AI 추천**을 하나의 서비스 흐름으로 통합했습니다.

> 개발 기간: `2026.05.28` ~ `2026.06.08` (12일)

---

## 📸 스크린샷

<details>
<summary><b>홈 피드</b> — 스토리 · 팔로잉 피드 · 추천 사이드바</summary>
<br />

![홈 피드](https://github.com/user-attachments/assets/3cbf4137-50ec-46d1-a0ca-ae52cc9863d0)

</details>

<details>
<summary><b>탐색 페이지</b> — 전체/추천 피드 · 카테고리 필터</summary>
<br />

![탐색](https://github.com/user-attachments/assets/ed253a26-6d54-48ba-b7ac-620989a4186d)

</details>

<details>
<summary><b>프로필</b> — OOTD 그리드 · 스타일 분석 · 다크/라이트 모드</summary>
<br />

**다크 모드**

![프로필 다크](https://github.com/user-attachments/assets/a8ddc2b0-1267-45e6-aa2d-4dbdfd8a7864)

**라이트 모드**

![프로필 라이트](https://github.com/user-attachments/assets/b2e692af-87ab-48b7-8b35-8394851ab597)

</details>

<details>
<summary><b>인기 랭킹</b> — 브랜드 · 아이템 · 스타일 순위</summary>
<br />

![랭킹](https://github.com/user-attachments/assets/779e09b8-bbe1-4e9f-97ca-b7e9f227ea7f)

</details>

<details>
<summary><b>스타일 배틀</b> — 두 코디 중 더 나은 핏 투표</summary>
<br />

![스타일 배틀](https://github.com/user-attachments/assets/2d2f033d-1548-4612-8673-7dba069acbfb)

</details>

<details>
<summary><b>패션 캘린더 · DM 시스템</b></summary>
<br />

**패션 캘린더**

![캘린더](https://github.com/user-attachments/assets/36bbb034-2070-45e4-b416-bc69982d9184)

**DM (실시간 채팅)**

![디엠](https://github.com/user-attachments/assets/78355d1d-1c43-40e7-b82e-8ef2bb2acf11)

</details>

---

## 🛠 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | React · Vite · Material UI v6 · Zustand · Axios · React Router DOM · Socket.io-client |
| **Backend** | Node.js · Express · Socket.io · JWT · Passport.js · Multer · Sharp · Nodemailer |
| **Database** | Oracle Database |
| **AI** | Google Gemini API |

---

## 🏗 아키텍처

```
[ React Client ]
       │
       │  HTTP / WebSocket
       ▼
[ Express Server ]
  ├─ Auth API          # 인증 · 소셜 로그인
  ├─ Post API          # 게시물 · 피드
  ├─ Chat API          # 실시간 채팅
  ├─ Story API         # 24시간 스토리
  ├─ Ranking API       # 인기 랭킹
  └─ AI Recommend API  # Gemini 기반 추천
        │
        ├──────────► [ Oracle DB ]
        └──────────► [ Gemini AI ]
```

---

## ✨ 주요 기능

### 🔐 사용자 인증
- 이메일 회원가입 / 로그인 + 이메일 인증
- JWT Access Token + Refresh Token 이중 구조
- 카카오 · 구글 소셜 로그인 (Passport.js)

### 📸 게시물 · 피드
- OOTD 게시물 작성 · 수정 · 삭제
- 다중 이미지 업로드 (Multer + Sharp 최적화)
- 아이템 정보 · 스타일 태그 등록
- 좋아요 · 댓글 · 북마크 · 리포스트
- 팔로잉 피드 / 탐색형 피드 구성

### 🤖 AI 스타일 추천
- 업로드한 패션 아이템 기반 코디 추천 (Google Gemini API)
- 개인 스타일 아카이브 분석 → 맞춤 스타일링 팁 제공

### 💬 실시간 커뮤니케이션
- 1:1 · 그룹 채팅 (Socket.io)
- 실시간 메시지 · 읽음 처리 · 타이핑 인디케이터
- 스토리 답장 · 팔로우 알림 드로어

### 🏆 부가 기능
- 24시간 스토리 (자동 만료)
- 브랜드 · 아이템 · 스타일 인기 랭킹 (주간/월간)
- 스타일 배틀 투표
- 패션 캘린더
- 다크 / 라이트 모드 (Zustand persist)

---

## 📁 폴더 구조

```
fashion-sns/
├── client/
│   └── src/
│       ├── components/    # 공통 UI 컴포넌트
│       ├── pages/         # 화면 단위 페이지
│       ├── api/           # API 통신 모듈
│       ├── store/         # 전역 상태 (Zustand)
│       ├── hooks/         # 커스텀 훅
│       └── router/        # 라우팅 구성
│
└── server/
    ├── config/            # DB · JWT · Passport 설정
    ├── controllers/       # 비즈니스 로직
    ├── middlewares/       # 인증 · 업로드 · 에러 처리
    ├── models/            # DB 접근 로직
    ├── routes/            # API 엔드포인트
    ├── scripts/           # 시드 · 마이그레이션
    ├── utils/             # AI · 이미지 · 메일 공통 유틸
    ├── app.js
    └── server.js
```

---

## 🔍 구현 포인트

### 1. JWT 인증 흐름
Access Token / Refresh Token을 분리해 보안성과 사용자 경험을 동시에 고려한 인증 구조를 설계했습니다.

### 2. 실시간 채팅
Socket.io로 메시지 송수신, 읽음 처리, 타이핑 인디케이터를 구현했습니다.
여러 채팅방에 걸쳐 읽지 않은 메시지 수와 상태가 일관되게 반영되도록 이벤트 구조를 정리하는 것이 핵심이었습니다.

### 3. AI 연동
Google Gemini API를 단순 호출이 아닌 서비스 기능의 일부로 녹여, 사용자의 패션 데이터에 기반한 개인화 추천 경험을 제공합니다.

### 4. 이미지 업로드 최적화
Multer + Sharp로 다중 이미지 업로드 → 리사이징 → 저장 흐름을 단계별로 분리해 안정적으로 처리합니다.

### 5. 역할 분리 중심의 백엔드 구조
Route · Controller · Model · Util을 역할별로 분리해 유지보수성과 확장성을 높였습니다.

> 더 자세한 구현 의도와 코드 단위 회고는 위 **코드 리뷰 문서**를 참고해 주세요.

---

## 🐛 트러블슈팅

| 문제 | 원인 | 해결 |
|------|------|------|
| Oracle CLOB 직렬화 오류 | 장문 데이터 JSON 변환 실패 | 응답 전 문자열 변환 처리 |
| Socket 상태 불일치 | 다수 화면에서 읽음·입장 상태 충돌 | 이벤트 구조 재설계 |
| 다중 이미지 순서 뒤바뀜 | 업로드·변환·저장 순서 혼재 | 단계별 파이프라인 분리 |
| Korean IME 입력 오작동 | 조합 중인 문자 이중 처리 | uncontrolled ref로 전환 |

---

## 🚀 실행 방법

### 사전 준비

- Node.js 18+
- Oracle Database
- Gemini API Key
- Kakao / Google OAuth 앱 설정

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

### 환경 변수 설정 (`.env`)

```env
PORT=5000
NODE_ENV=development

# Database
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_CONNECT_STRING=your_oracle_connection_string

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Client
CLIENT_URL=http://localhost:5173

# OAuth
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CALLBACK_URL=your_kakao_callback_url
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Mail
MAIL_USER=your_mail_account
MAIL_PASS=your_mail_app_password

# AI
GEMINI_API_KEY=your_gemini_api_key
```

---

<div align="center">

*© 2026 FITLOG*

</div>
