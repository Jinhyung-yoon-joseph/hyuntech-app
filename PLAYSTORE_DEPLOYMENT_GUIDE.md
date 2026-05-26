# 현테크 현장관리 - 플레이스토어 배포 가이드

## 📱 앱 정보
- **앱 이름:** 현테크 현장관리
- **패키지명:** com.hyuntech.fieldmanagement
- **버전:** 1.0 (versionCode: 1)
- **최소 SDK:** API 22 (Android 5.1)
- **대상 SDK:** API 34 (Android 14)

---

## 🔑 Step 1: 서명 키 생성 (Signing Key)

플레이스토어에 앱을 올리려면 **서명 키**가 필요합니다. 처음 한 번만 생성하면 됩니다.

### 1-1. 서명 키 생성 (Linux/Mac)

```bash
cd /home/ubuntu/hyuntech-field/android

# 서명 키 생성 (처음 한 번만)
keytool -genkey -v -keystore hyuntech-release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias hyuntech-key

# 프롬프트에서 다음 정보 입력:
# - 키스토어 비밀번호: (6자 이상 입력, 기억해두기!)
# - 키 비밀번호: (위와 동일하게 입력)
# - 이름: 현테크
# - 조직: 현테크
# - 도시: 서울
# - 국가 코드: KR
```

**생성된 파일:** `android/hyuntech-release.keystore` (안전하게 보관!)

### 1-2. 서명 키 정보 확인

```bash
keytool -list -v -keystore android/hyuntech-release.keystore
```

---

## 🏗️ Step 2: 릴리스 빌드 생성

### 2-1. build.gradle 수정 (서명 설정)

`android/app/build.gradle` 파일을 열어서 다음을 추가합니다:

```gradle
android {
    // ... 기존 설정 ...
    
    signingConfigs {
        release {
            storeFile file("../hyuntech-release.keystore")
            storePassword "YOUR_KEYSTORE_PASSWORD"  // 생성할 때 입력한 비밀번호
            keyAlias "hyuntech-key"
            keyPassword "YOUR_KEY_PASSWORD"  // 생성할 때 입력한 비밀번호
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 2-2. 릴리스 APK 빌드

```bash
cd /home/ubuntu/hyuntech-field

# 웹 앱 빌드
pnpm build

# 웹 자산을 Android에 복사
pnpm exec cap sync android

# Android 릴리스 빌드 (APK)
cd android
./gradlew assembleRelease

# 또는 AAB (Android App Bundle) - 플레이스토어 권장
./gradlew bundleRelease
```

**생성된 파일:**
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab` (권장)

---

## 📦 Step 3: 플레이스토어 등록

### 3-1. Google Play Console 접속

1. [Google Play Console](https://play.google.com/console) 접속
2. Google 계정으로 로그인
3. **새 앱 만들기** 클릭

### 3-2. 앱 정보 입력

| 항목 | 값 |
|------|-----|
| 앱 이름 | 현테크 현장관리 |
| 기본 언어 | 한국어 |
| 앱 또는 게임 | 앱 |
| 무료 또는 유료 | 무료 |

### 3-3. 앱 세부정보 작성

**좌측 메뉴 → 앱 정보**

- **앱 이름:** 현테크 현장관리
- **짧은 설명:** 건설업 현장 직원을 위한 공지, 자료, 시험 관리 포털
- **전체 설명:** 
  ```
  현테크 현장관리는 건설 현장의 신규자와 재직자를 위한 
  통합 관리 포털입니다.
  
  주요 기능:
  - 공지사항 및 자료실 (언제든 열람 가능)
  - 전자서명 기능
  - Q&A 게시판
  - 입사시험 응시
  - 작업일보 관리
  - 실시간 알림
  ```
- **카테고리:** 비즈니스
- **콘텐츠 등급:** 일반

### 3-4. 스크린샷 및 이미지 업로드

**좌측 메뉴 → 스크린샷**

- 휴대폰 스크린샷 (5개 이상)
- 태블릿 스크린샷 (선택사항)
- 앱 아이콘 (512x512px)
- 기능 그래픽 (1024x500px)

### 3-5. 개인정보 보호정책 링크

**좌측 메뉴 → 앱 정보 → 개인정보 보호정책**

```
https://hyuntechapp-h2wwvu32.manus.space/privacy
```

(없으면 간단한 정책 페이지를 웹 앱에 추가)

---

## 🔐 Step 4: 콘텐츠 등급 및 대상

### 4-1. 콘텐츠 등급 설정

**좌측 메뉴 → 콘텐츠 등급**

- 모든 항목에 "아니오" 선택
- 등급: **일반** (3세 이상)

### 4-2. 대상 오디언스

**좌측 메뉴 → 대상 오디언스**

- 대상: 비즈니스 사용자 (B2B)
- 연령: 18세 이상

---

## 📤 Step 5: APK/AAB 업로드

### 5-1. 테스트 버전 먼저 배포

**좌측 메뉴 → 테스트 → 내부 테스트**

1. **새 릴리스 만들기** 클릭
2. APK/AAB 파일 업로드
3. 릴리스 정보 입력:
   ```
   버전: 1.0
   변경사항: 초기 출시
   ```
4. **검토를 위해 제출** 클릭

### 5-2. 내부 테스트 (2-3시간)

- 테스터 이메일 추가
- 테스트 링크 공유
- 앱 정상 작동 확인

### 5-3. 프로덕션 배포

**좌측 메뉴 → 프로덕션**

1. **새 릴리스 만들기** 클릭
2. 내부 테스트에서 성공한 APK/AAB 선택
3. 릴리스 정보 입력
4. **검토를 위해 제출** 클릭

---

## ⏳ Step 6: 심사 대기

플레이스토어 심사 시간:
- **첫 배포:** 24-48시간
- **업데이트:** 2-4시간

심사 중 앱이 거부되면:
- 거부 사유 확인
- 필요한 수정 진행
- 다시 제출

---

## 🔄 Step 7: 업데이트 배포

### 7-1. 버전 업데이트

앱을 수정한 후 배포할 때:

```bash
# 1. 웹 앱 수정 및 빌드
pnpm build

# 2. Android에 동기화
pnpm exec cap sync android

# 3. build.gradle에서 versionCode 증가
# versionCode 1 → 2 (또는 더 높은 숫자)
# versionName "1.0" → "1.1"

# 4. 릴리스 빌드
cd android
./gradlew bundleRelease

# 5. Google Play Console에서 새 릴리스 생성
```

### 7-2. 소소한 수정 (심사 불필요)

- 공지사항 내용 수정 → 웹만 수정 (자동 반영)
- 자료실 파일 추가 → 웹만 수정 (자동 반영)
- UI 텍스트 변경 → 웹만 수정 (자동 반영)

### 7-3. 주요 기능 추가 (심사 필요)

- 새로운 기능 추가
- 권한 변경
- 외부 라이브러리 추가

---

## 📊 배포 후 모니터링

### Google Play Console 대시보드

- **설치 수:** 실시간 추적
- **평점:** 사용자 리뷰 및 평가
- **충돌:** 앱 오류 모니터링
- **성능:** 앱 크기, 배터리 사용량 등

### 사용자 피드백 대응

1. 리뷰 읽기
2. 문제 파악
3. 웹 앱 수정
4. 새 버전 배포

---

## 🆘 문제 해결

### Q: "서명 키를 잃어버렸어요"
**A:** 새 키를 생성하고 새 앱으로 등록해야 합니다 (기존 앱은 유지 불가).

### Q: "심사가 거부되었어요"
**A:** 거부 사유 확인 후 수정하고 다시 제출하세요.

### Q: "앱이 크래시돼요"
**A:** Google Play Console의 "충돌" 섹션에서 오류 로그 확인.

### Q: "업데이트가 안 나타나요"
**A:** 앱을 완전히 종료 후 재시작하거나, 플레이스토어에서 "업데이트" 버튼 클릭.

---

## 📝 체크리스트

배포 전 확인사항:

- [ ] 앱 이름, 설명, 카테고리 입력
- [ ] 스크린샷 5개 이상 업로드
- [ ] 개인정보 보호정책 링크 제공
- [ ] 콘텐츠 등급 설정
- [ ] 서명 키 생성 및 안전하게 보관
- [ ] 릴리스 빌드 생성 (APK/AAB)
- [ ] 내부 테스트 완료
- [ ] 프로덕션 배포 제출
- [ ] 심사 완료 (24-48시간 대기)

---

## 💡 팁

1. **버전 관리:** versionCode는 항상 증가해야 함 (1 → 2 → 3...)
2. **AAB 권장:** APK보다 AAB가 플레이스토어에서 권장됨
3. **테스트 먼저:** 내부 테스트에서 충분히 테스트 후 배포
4. **자동 업데이트:** 사용자가 플레이스토어에서 "업데이트" 클릭하면 자동 설치
5. **웹 부분 수정:** 공지, 자료 등 웹 부분 수정은 앱 재배포 불필요

---

## 📞 지원

문제가 생기면:
- Google Play Console 헬프: https://support.google.com/googleplay
- Capacitor 문서: https://capacitorjs.com/docs
