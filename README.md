# 현테크 현장관리 - 웹앱 (PWA)

스마트폰 홈 화면에 추가하면 앱처럼 사용할 수 있는 PWA입니다.

---

## Railway 배포 방법 (무료/월 5달러)

### 1단계 - GitHub에 올리기

1. [github.com](https://github.com) 접속 → 로그인
2. 우측 상단 `+` → `New repository`
3. Repository name: `hyuntech-app` → `Create repository`
4. 이 폴더를 업로드:
   ```
   git init
   git add .
   git commit -m "first commit"
   git remote add origin https://github.com/[내아이디]/hyuntech-app.git
   git push -u origin main
   ```

### 2단계 - Railway 설정

1. [railway.app](https://railway.app) → `Start a New Project`
2. `Deploy from GitHub repo` → GitHub 연결 → `hyuntech-app` 선택
3. 자동 빌드 시작됨

### 3단계 - MySQL 데이터베이스 추가

1. Railway 프로젝트에서 `+ New` → `Database` → `Add MySQL`
2. MySQL 서비스 클릭 → `Variables` 탭 → `DATABASE_URL` 복사

### 4단계 - 환경변수 설정

Railway 앱 서비스 클릭 → `Variables` 탭 → 아래 항목 추가:

| 키 | 값 |
|----|----|
| DATABASE_URL | (MySQL에서 복사한 값) |
| JWT_SECRET | (임의의 긴 문자열, 예: `abc123xyz456...`) |
| ADMIN_REGISTER_KEY | (관리자 등록할 때 쓸 비밀번호) |
| NODE_ENV | production |

### 5단계 - 도메인 확인

Railway → 앱 서비스 → `Settings` → `Domains` → 자동 생성된 URL 확인
예: `https://hyuntech-app.up.railway.app`

---

## 처음 시작할 때

1. 위 URL로 접속
2. `계정 등록` 탭 → 사번/이름/비밀번호 입력
3. **최초 등록자가 자동으로 관리자** (추가 설정 불필요)
4. 이후 직원들은 같은 URL에서 계정 등록 후 로그인

---

## 스마트폰 앱으로 설치하는 방법

### 안드로이드 (크롬)
1. 앱 URL 접속
2. 주소창 옆 `⋮` 메뉴 → `홈 화면에 추가`
3. 이름 확인 후 `추가`

### 아이폰 (사파리)
1. 앱 URL 접속 (반드시 사파리로!)
2. 하단 공유 버튼(□↑) → `홈 화면에 추가`
3. 이름 확인 후 `추가`

설치하면 스플래시 화면과 함께 앱처럼 실행됩니다.

---

## 로컬 개발 환경

```bash
# 의존성 설치
pnpm install

# .env 파일 설정
cp .env.example .env
# DATABASE_URL, JWT_SECRET 입력

# DB 초기화
pnpm db:push

# 개발 서버 실행
pnpm dev
```
