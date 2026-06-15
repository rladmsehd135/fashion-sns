# FITLOG — 패션 SNS

> 패션 콘텐츠 공유 · AI 스타일 추천 · 실시간 커뮤니티를 하나로

<br />

## 프로젝트 소개

**FITLOG**는 사용자가 자신의 코디(OOTD)를 업로드하고, 팔로워와 소통하며, AI 기반 스타일 추천까지 받을 수 있는 패션 특화 SNS입니다.

단순 게시판을 넘어 **인증 · 피드 · 실시간 채팅 · 스토리 · 랭킹 · 추천**을 하나의 서비스 흐름 안에 통합했습니다.

<br />

---

## 🎬 시연 영상

[![시연 영상 보기](https://img.shields.io/badge/▶_시연_영상_보기-Google_Drive-4285F4?style=for-the-badge&logo=googledrive&logoColor=white)](https://drive.google.com/drive/folders/1oaEytcE0jzVD3hqHgNq9BROj8nH7tUs_)

<br />

---

## 📸 스크린샷

### 홈 피드
> 스토리 · 팔로잉 피드 · 외워님을 위한 추천 사이드바

![홈 피드](.<img width="1920" height="988" alt="image" src="https://github.com/user-attachments/assets/3cbf4137-50ec-46d1-a0ca-ae52cc9863d0" />
)

---

### 탐색 페이지
> 전체 / 추천 피드 · 카테고리 필터 (테크웨어 · 캐주얼 · 스트릿 등)

![탐색]<img width="1914" height="961" alt="image" src="https://github.com/user-attachments/assets/ed253a26-6d54-48ba-b7ac-620989a4186d" />


---

### 프로필 — 다크 모드
> OOTD 그리드 · 스타일 분석 · AI 코디 버튼 · 팔로워/팔로잉

![프로필 다크]<img width="1913" height="960" alt="image" src="https://github.com/user-attachments/assets/a8ddc2b0-1267-45e6-aa2d-4dbdfd8a7864" />


---

### 프로필 — 라이트 모드
> 다크/라이트 테마 전환 (Zustand persist)

![프로필 라이트]<img width="1913" height="959" alt="image" src="https://github.com/user-attachments/assets/b2e692af-87ab-48b7-8b35-8394851ab597" />


---

### 인기 랭킹
> 브랜드 · 아이템 · 스타일 순위 · 주간/월간 필터

![랭킹]<img width="1916" height="955" alt="image" src="https://github.com/user-attachments/assets/779e09b8-bbe1-4e9f-97ca-b7e9f227ea7f" />


---

### 스타일 배틀
> WHOSE FIT IS MORE AESTHETIC? — 두 코디 중 더 나은 핏 투표

![스타일 배틀]<img width="1919" height="960" alt="image" src="https://github.com/user-attachments/assets/2d2f033d-1548-4612-8673-7dba069acbfb" />

### 패션 캘린더

![패션 캘린더]<img width="1915" height="959" alt="image" src="https://github.com/user-attachments/assets/36bbb034-2070-45e4-b416-bc69982d9184" />

### 디엠 시스템


![디엠]<img width="1920" height="955" alt="image" src="https://github.com/user-attachments/assets/78355d1d-1c43-40e7-b82e-8ef2bb2acf11" />




<br />

---

## 개발 기간

| 항목 | 일정 |
|------|------|
| 개발 기간 | 2026.05.28 ~ 2026.06.08 |
| 산출물 마감 | 2026.06.09 |
| 제출 항목 | 발표 자료, Git 저장소 |

<br />

---

## 기술 스택

### Frontend
`React` `Vite` `Material UI` `Zustand` `Axios` `React Router DOM` `Socket.io-client`

### Backend
`Node.js` `Express` `Oracle Database` `Socket.io` `JWT` `Passport.js` `Multer` `Sharp` `Nodemailer` `Google Gemini API`

<br />

---

## 아키텍처

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

<br />

---

## 주요 기능

### 🔐 사용자 인증
- 이메일 회원가입 / 로그인
- JWT Access Token + Refresh Token 구조
- 카카오 · 구글 소셜 로그인
- 이메일 인증

### 📸 게시물 · 피드
- OOTD 게시물 작성 · 수정 · 삭제
- 다중 이미지 업로드 (Multer + Sharp 최적화)
- 아이템 정보 · 스타일 태그 등록
- 좋아요 · 댓글 · 북마크
- 팔로잉 피드 / 탐색형 피드 구성

### 🤖 AI 스타일 추천
- 업로드한 패션 아이템 기반 코디 추천 (Google Gemini API)
- 스타일링 팁 · 조합 제안

### 💬 실시간 커뮤니케이션
- 1:1 · 그룹 채팅 (Socket.io)
- 실시간 메시지 · 읽음 처리 · 타이핑 인디케이터
- 팔로우 알림 드로어

### 🏆 부가 기능
- 24시간 스토리
- 브랜드 · 아이템 · 스타일 인기 랭킹
- 스타일 배틀 투표
- 팔로우 · 팔로잉 네트워크
- 다크 / 라이트 모드 (Zustand persist)

<br />

---

## 폴더 구조

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

<br />

---

## 구현 포인트

### 1. JWT 인증 흐름
Access Token / Refresh Token을 분리해 보안성과 사용자 경험을 함께 고려한 인증 구조를 설계했습니다.

### 2. 실시간 채팅
Socket.io로 메시지 송수신, 읽음 처리, 타이핑 인디케이터를 구현했습니다. 여러 채팅방에서 읽지 않은 메시지 수와 상태가 일관되게 반영되도록 이벤트 구조를 정리하는 것이 핵심이었습니다.

### 3. AI 연동
Google Gemini API를 단순 호출이 아닌 **서비스 기능의 일부**로 녹여, 사용자의 패션 데이터에 기반한 개인화 추천 경험을 제공합니다.

### 4. 이미지 업로드 최적화
Multer + Sharp로 다중 이미지 업로드 → 리사이징 → 저장 흐름을 분리해 안정적으로 처리합니다.

### 5. 역할 분리 중심의 백엔드 구조
Route · Controller · Model · Util을 역할별로 분리해 유지보수성과 확장성을 높였습니다.

<br />

---

## 트러블슈팅

| 문제 | 원인 | 해결 |
|------|------|------|
| Oracle CLOB 직렬화 오류 | 장문 데이터 JSON 변환 실패 | 응답 전 문자열 변환 처리 |
| Socket 상태 불일치 | 다수 화면에서 읽음·입장 상태 충돌 | 이벤트 구조 재설계 |
| 다중 이미지 순서 뒤바뀜 | 업로드·변환·저장 순서 혼재 | 단계별 파이프라인 분리 |
| Korean IME 입력 오작동 | 조합 중인 문자 이중 처리 | uncontrolled ref로 전환 |

<br />

---

## 실행 방법

### 사전 준비
- Node.js 18+
- Oracle Database
- Gemini API Key
- Kakao / Google OAuth 앱 설정

### 서버

```bash
cd server
npm install
npm run dev
```

### 클라이언트

```bash
cd client
npm install
npm run dev
```

### 환경 변수 (`.env` 예시)

```env
PORT=5000
NODE_ENV=development

DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_CONNECT_STRING=your_oracle_connection_string

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

CLIENT_URL=http://localhost:5173

KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CALLBACK_URL=your_kakao_callback_url

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

MAIL_USER=your_mail_account
MAIL_PASS=your_mail_app_password

GEMINI_API_KEY=your_gemini_api_key
```

<br />

---

## 배운점

이 프로젝트는 단순 CRUD를 넘어 아래 스킬을 한 번에 상승시켜줍니다.

- 사용자 중심 서비스를 코드로 구현하는 **기획 → 구현 역량**
- React + Express + Oracle를 연결하는 **풀스택 개발 역량**
- OAuth · 메일 · AI API를 서비스 흐름에 통합한 **외부 연동 경험**
- 기능이 많은 프로젝트를 구조적으로 정리하는 **설계 습관**
- 문제 원인을 추적하고 안정적으로 개선하는 **디버깅 역량**

<br />

---

*© 2026 FITLOG*
