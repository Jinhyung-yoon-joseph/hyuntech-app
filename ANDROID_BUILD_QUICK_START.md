# 안드로이드 앱 빌드 - 빠른 시작 가이드

## 🚀 5분 안에 APK 빌드하기

### Step 1: 웹 앱 빌드
```bash
cd /home/ubuntu/hyuntech-field
pnpm build
```

### Step 2: Android에 동기화
```bash
pnpm exec cap sync android
```

### Step 3: 릴리스 빌드 생성
```bash
cd android
./gradlew assembleRelease
```

**완료!** 
- APK 파일: `android/app/build/outputs/apk/release/app-release.apk`
- 크기: 약 50-60MB

---

## 📱 APK 테스트하기

### 방법 1: USB 연결 (권장)
```bash
# 안드로이드 폰을 USB로 연결
adb install android/app/build/outputs/apk/release/app-release.apk
```

### 방법 2: 파일 전송
1. APK 파일을 폰으로 전송
2. 폰에서 파일 관리자 열기
3. APK 파일 탭 → 설치

---

## 🔐 서명 키 생성 (처음 한 번만)

```bash
cd /home/ubuntu/hyuntech-field/android

keytool -genkey -v -keystore hyuntech-release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias hyuntech-key

# 프롬프트에서:
# 비밀번호: 입력 (기억해두기!)
# 이름: 현테크
# 조직: 현테크
# 도시: 서울
# 국가: KR
```

---

## 📦 AAB (플레이스토어용) 빌드

```bash
cd /home/ubuntu/hyuntech-field/android
./gradlew bundleRelease
```

**생성 위치:** `app/build/outputs/bundle/release/app-release.aab`

---

## 🔄 업데이트 배포

1. 웹 앱 수정
2. `pnpm build` 실행
3. `pnpm exec cap sync android` 실행
4. `build.gradle`에서 버전 증가:
   ```gradle
   versionCode 1 → 2
   versionName "1.0" → "1.1"
   ```
5. `./gradlew bundleRelease` 실행
6. Google Play Console에서 새 릴리스 생성

---

## ⚙️ 주요 설정 파일

| 파일 | 위치 | 설명 |
|------|------|------|
| 앱 이름 | `android/app/src/main/res/values/strings.xml` | 앱 이름 변경 |
| 권한 | `android/app/src/main/AndroidManifest.xml` | 필요한 권한 추가 |
| 버전 | `android/app/build.gradle` | versionCode, versionName |
| 서명 | `android/app/build.gradle` | 서명 키 설정 |

---

## 🆘 일반적인 오류

### "gradle not found"
```bash
cd /home/ubuntu/hyuntech-field/android
chmod +x gradlew
./gradlew bundleRelease
```

### "Build failed"
```bash
# 캐시 삭제 후 재빌드
./gradlew clean bundleRelease
```

### "Out of memory"
```bash
# gradle.properties 수정
org.gradle.jvmargs=-Xmx2048m
```

---

## 📊 파일 크기 최적화

현재 앱 크기: ~50-60MB

줄이는 방법:
1. 불필요한 라이브러리 제거
2. 이미지 최적화
3. 코드 난독화 (proguard)

---

## 💡 팁

- **개발 중:** `pnpm dev`로 웹 버전 테스트
- **배포 전:** 내부 테스트로 충분히 검증
- **버전 관리:** versionCode는 항상 증가해야 함
- **자동 업데이트:** 플레이스토어가 자동으로 사용자에게 배포

---

## 📖 전체 가이드

자세한 배포 방법: `PLAYSTORE_DEPLOYMENT_GUIDE.md` 참고
