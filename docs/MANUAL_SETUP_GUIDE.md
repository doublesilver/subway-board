# 수동 설정 가이드

이 문서는 gagisiro.com 프로젝트에서 **반드시 수동으로 설정해야 하는 항목**들을 정리한 가이드입니다.

> 코드로 자동화할 수 없는 항목들(계정 인증, 외부 서비스 연동 등)만 포함되어 있습니다.

---

## 목차

| 순서 | 항목 | 중요도 | 예상 소요시간 |
|:---:|------|:------:|:------------:|
| 1 | [GitHub Actions 설정](#1-github-actions-설정) | **필수** | 10분 |
| 2 | [외부 모니터링 서비스](#2-외부-모니터링-서비스-연동) | **필수** | 5분 |
| 3 | [Grafana/Prometheus 설정](#3-grafanaprometheus-설정) | 권장 | 10분 |
| 4 | [원격 백업 (rclone)](#4-원격-백업-rclone-설정) | 권장 | 15분 |
| 5 | [Cloudflare 설정](#5-cloudflare-설정) | 선택 | 20분 |
| 6 | [개발 환경 설정](#6-개발-환경-설정) | 개발용 | 5분 |

---

## 1. GitHub Actions 설정

> **왜 필요한가요?**
> - 코드 푸시 시 자동으로 테스트 실행
> - main 브랜치 병합 시 라즈베리파이에 자동 배포
> - 보안 취약점 자동 스캔

### 1.1 GitHub Secrets 등록하기

#### Step 1: GitHub 저장소로 이동
1. 브라우저에서 GitHub 저장소 열기
2. 상단 탭에서 **Settings** 클릭

#### Step 2: Secrets 메뉴 찾기
1. 왼쪽 사이드바에서 **Secrets and variables** 클릭
2. **Actions** 클릭

#### Step 3: 시크릿 추가하기
**New repository secret** 버튼을 클릭하고 아래 항목들을 하나씩 추가하세요:

| Name | 값 설명 | 예시 값 |
|------|--------|--------|
| `PI_HOST` | 라즈베리파이 Tailscale IP 주소 | `100.64.0.1` |
| `PI_USERNAME` | SSH 접속 사용자명 | `pi` |
| `PI_SSH_KEY` | SSH 개인키 전체 내용 (아래 참조) | `-----BEGIN OPENSSH...` |
| `PI_PORT` | SSH 포트 번호 | `22` |
| `HEALTH_CHECK_URL` | 헬스체크 엔드포인트 URL | `https://leeeunseok.tail32c3e2.ts.net/health` |
| `VITE_API_URL` | 프론트엔드에서 사용할 API URL | `https://leeeunseok.tail32c3e2.ts.net` |

### 1.2 SSH 키 생성하기 (라즈베리파이에서 실행)

#### Step 1: 라즈베리파이에 SSH 접속
```bash
ssh pi@<라즈베리파이-IP>
```

#### Step 2: 새 SSH 키 생성
```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions
```
- 비밀번호(passphrase)를 묻는 화면이 나오면 **Enter를 두 번** 눌러 비밀번호 없이 생성

#### Step 3: 공개키를 authorized_keys에 추가
```bash
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
```

#### Step 4: 개인키 내용 복사
```bash
cat ~/.ssh/github_actions
```
출력되는 내용 전체를 복사합니다:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAA...
(여러 줄의 문자열)
...
-----END OPENSSH PRIVATE KEY-----
```

#### Step 5: GitHub에 개인키 등록
1. GitHub > Settings > Secrets > Actions
2. **New repository secret** 클릭
3. Name: `PI_SSH_KEY`
4. Secret: 위에서 복사한 개인키 전체 붙여넣기
5. **Add secret** 클릭

### 1.3 Tailscale IP 확인하기

라즈베리파이에서 실행:
```bash
tailscale ip -4
```
출력된 IP 주소(예: `100.64.0.1`)를 `PI_HOST`에 등록합니다.

### 1.4 설정 확인

모든 시크릿이 등록되었는지 확인:

```
PI_HOST          ✓
PI_USERNAME      ✓
PI_SSH_KEY       ✓
PI_PORT          ✓
HEALTH_CHECK_URL ✓
VITE_API_URL     ✓
```

### 1.5 (선택) Codecov 연동

테스트 커버리지를 시각화하고 싶다면:

1. [codecov.io](https://codecov.io) 접속
2. **Sign up with GitHub** 클릭
3. 저장소 선택 및 활성화
4. 대시보드에서 **CODECOV_TOKEN** 복사
5. GitHub Secrets에 `CODECOV_TOKEN` 추가

---

## 2. 외부 모니터링 서비스 연동

> **왜 필요한가요?**
> - 라즈베리파이 자체가 다운되면 내부 모니터링도 동작하지 않습니다
> - 외부 서비스가 주기적으로 체크하여 다운 시 알림을 보내줍니다

### 2.1 UptimeRobot 설정 (무료, 추천)

#### Step 1: 회원가입
1. [uptimerobot.com](https://uptimerobot.com) 접속
2. **Register for FREE** 클릭
3. 이메일로 회원가입

#### Step 2: 모니터 생성
1. 로그인 후 **+ Add New Monitor** 클릭
2. 아래와 같이 설정:

| 항목 | 값 |
|-----|-----|
| Monitor Type | `HTTP(s)` |
| Friendly Name | `가기싫어` |
| URL (or IP) | `https://leeeunseok.tail32c3e2.ts.net/health` |
| Monitoring Interval | `5 minutes` (무료 플랜 최소값) |

3. **Create Monitor** 클릭

#### Step 3: 알림 설정
1. 왼쪽 메뉴에서 **My Settings** > **Alert Contacts** 클릭
2. 이메일 알림은 기본 설정됨
3. (선택) 텔레그램 알림 추가:
   - **Add Alert Contact** 클릭
   - Type: `Telegram`
   - 안내에 따라 텔레그램 봇 연동

### 2.2 BetterStack 설정 (대안)

더 많은 기능이 필요하다면:

1. [betterstack.com](https://betterstack.com) 접속
2. 회원가입 후 **Monitors** > **Create Monitor**
3. URL: `https://leeeunseok.tail32c3e2.ts.net/health`
4. 체크 간격 및 알림 설정

---

## 3. Grafana/Prometheus 설정

> **왜 필요한가요?**
> - 서버 성능(CPU, 메모리, 응답시간) 시각화
> - 트래픽 패턴 분석
> - 문제 발생 시 원인 파악

### 3.1 모니터링 스택 실행

#### Step 1: 라즈베리파이에 SSH 접속
```bash
ssh pi@<라즈베리파이-IP>
```

#### Step 2: 프로젝트 디렉토리로 이동
```bash
cd ~/side
```

#### Step 3: Docker 네트워크 생성 (처음 한 번만)
```bash
docker network create subway-network 2>/dev/null || echo "네트워크가 이미 존재합니다"
```

#### Step 4: 모니터링 스택 실행
```bash
docker compose -f docker-compose.monitoring.yml up -d
```

#### Step 5: 실행 확인
```bash
docker ps | grep -E "prometheus|grafana|node-exporter"
```
3개의 컨테이너가 보여야 합니다.

### 3.2 Grafana 접속 및 비밀번호 변경

#### Step 1: Grafana 웹 접속
브라우저에서 열기:
```
http://<라즈베리파이-IP>:3001
```

#### Step 2: 기본 계정으로 로그인
- Username: `admin`
- Password: `admin`

#### Step 3: 비밀번호 변경 (필수!)
1. 첫 로그인 시 비밀번호 변경 화면이 나타남
2. 새 비밀번호 입력 (안전한 비밀번호 사용)
3. **Save** 클릭

> **주의**: 기본 비밀번호를 그대로 사용하면 보안 위험이 있습니다!

### 3.3 대시보드 확인

1. 왼쪽 메뉴에서 **Dashboards** 클릭
2. **Browse** 클릭
3. **Subway Board Dashboard** 선택
4. 메트릭이 표시되는지 확인

### 3.4 (선택) 외부에서 Grafana 접속

Tailscale Funnel로 외부 접속을 허용하려면:

```bash
# Grafana를 외부에 노출 (보안에 주의!)
sudo tailscale serve --bg --https=3001 localhost:3001
sudo tailscale funnel 3001
```

> **경고**: 외부 노출 시 반드시 강력한 비밀번호를 사용하세요!

### 3.5 환경변수로 비밀번호 설정 (권장)

매번 수동 변경 대신 환경변수로 설정:

```bash
# .env 파일 편집
nano ~/side/.env
```

아래 내용 추가:
```bash
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=여기에_안전한_비밀번호_입력
GRAFANA_ROOT_URL=http://localhost:3001
```

저장 후 컨테이너 재시작:
```bash
docker compose -f docker-compose.monitoring.yml down
docker compose -f docker-compose.monitoring.yml up -d
```

---

## 4. 원격 백업 (rclone) 설정

> **왜 필요한가요?**
> - SD 카드 고장 시 데이터 복구 가능
> - Google Drive에 자동으로 백업 파일 업로드
> - 30일간의 백업 이력 유지

### 4.1 rclone 설치

#### Step 1: 라즈베리파이에서 rclone 설치
```bash
curl https://rclone.org/install.sh | sudo bash
```

#### Step 2: 설치 확인
```bash
rclone version
```

### 4.2 Google Drive 연동

#### Step 1: rclone 설정 시작
```bash
rclone config
```

#### Step 2: 새 리모트 생성
```
e/n/d/r/c/s/q> n
```
`n`을 입력하고 Enter

#### Step 3: 리모트 이름 입력
```
name> gdrive
```

#### Step 4: 스토리지 타입 선택
목록에서 `Google Drive` 번호를 찾아 입력 (보통 `drive` 또는 번호)
```
Storage> drive
```

#### Step 5: 기본값으로 진행
아래 항목들은 모두 Enter를 눌러 기본값 사용:
```
client_id> (Enter)
client_secret> (Enter)
scope> 1 (Full access)
service_account_file> (Enter)
Edit advanced config> n
Use auto config> n
```

#### Step 6: 인증 URL 처리

**"Use auto config?"** 질문에서 `n`을 선택하면 아래와 같은 메시지가 나타납니다:

```
Option config_token.
For this to work, you will need rclone available on a machine that has
a web browser available.
...
config_token>
```

**다른 컴퓨터(데스크탑/노트북)에서:**

1. rclone 설치 (Windows/Mac)
   - Windows: [rclone 다운로드](https://rclone.org/downloads/)
   - Mac: `brew install rclone`

2. 터미널에서 실행:
   ```bash
   rclone authorize "drive"
   ```

3. 브라우저가 열리면 Google 계정으로 로그인

4. "rclone이 Google Drive에 액세스하도록 허용"에서 **허용** 클릭

5. 터미널에 토큰이 출력됨:
   ```
   Paste the following into your remote machine --->
   {"access_token":"ya29.xxx...","token_type":"Bearer",...}
   <---End paste
   ```

6. 이 전체 JSON을 복사

**다시 라즈베리파이에서:**

```
config_token> (위에서 복사한 JSON 붙여넣기)
```

#### Step 7: 팀 드라이브 설정
```
Configure this as a Shared Drive (Team Drive)? (y/n)> n
```

#### Step 8: 설정 확인
```
y/e/d> y
```

#### Step 9: 설정 종료
```
e/n/d/r/c/s/q> q
```

### 4.3 연결 테스트

```bash
# Google Drive 연결 확인
rclone lsd gdrive:

# 백업 폴더 생성
rclone mkdir gdrive:gagisiro-backups

# 폴더 생성 확인
rclone lsd gdrive:
```

`gagisiro-backups` 폴더가 보이면 성공!

### 4.4 수동 백업 테스트

```bash
# 백업 스크립트 실행
~/side/scripts/backup-remote.sh upload
```

Google Drive에서 `gagisiro-backups` 폴더를 확인하여 백업 파일이 업로드되었는지 확인합니다.

### 4.5 자동 백업 설정 (Cron)

#### Step 1: crontab 편집
```bash
crontab -e
```

처음 실행 시 에디터를 선택하라고 나오면 `1` (nano)을 선택합니다.

#### Step 2: 아래 줄 추가
```bash
# 매일 새벽 4시에 원격 백업 (로컬 백업 1시간 후)
0 4 * * * /home/pi/side/scripts/backup-remote.sh full >> /var/log/backup-remote.log 2>&1
```

#### Step 3: 저장 및 종료
- nano: `Ctrl+X`, `Y`, `Enter`
- vim: `Esc`, `:wq`, `Enter`

#### Step 4: cron 설정 확인
```bash
crontab -l
```

### 4.6 백업 상태 확인

```bash
# 최근 백업 로그 확인
tail -20 /var/log/backup-remote.log

# Google Drive 백업 목록 확인
rclone ls gdrive:gagisiro-backups
```

---

## 5. Cloudflare 설정

> **왜 필요한가요?**
> - 커스텀 도메인 사용 (예: gagisiro.com)
> - DDoS 공격 방어
> - 정적 파일 캐싱으로 속도 향상
> - 무료 SSL 인증서

> **참고**: Tailscale Funnel URL만 사용한다면 이 설정은 필요 없습니다.

### 5.1 사전 준비

- 도메인 필요 (예: gagisiro.com)
- Cloudflare 계정

### 5.2 Cloudflare 계정 생성

1. [cloudflare.com](https://cloudflare.com) 접속
2. **Sign Up** 클릭
3. 이메일, 비밀번호 입력하여 가입

### 5.3 도메인 추가

#### Step 1: 도메인 입력
1. 로그인 후 **Add a Site** 클릭
2. 도메인 입력 (예: `gagisiro.com`)
3. **Add Site** 클릭

#### Step 2: 플랜 선택
1. **Free** 플랜 선택 (무료)
2. **Continue** 클릭

#### Step 3: 네임서버 변경
Cloudflare가 제공하는 네임서버로 변경해야 합니다:
```
ns1.cloudflare.com
ns2.cloudflare.com
```

**도메인 등록업체에서 네임서버 변경:**
- 가비아: 도메인 관리 > 네임서버 설정
- 후이즈: 도메인 관리 > 네임서버 변경
- Namecheap: Domain List > Nameservers > Custom DNS

변경 후 전파까지 최대 24시간 소요될 수 있습니다.

### 5.4 DNS 레코드 설정

#### Step 1: DNS 설정 페이지로 이동
1. Cloudflare 대시보드에서 도메인 선택
2. 왼쪽 메뉴에서 **DNS** > **Records** 클릭

#### Step 2: CNAME 레코드 추가
**Add record** 클릭 후:

| 항목 | 값 |
|-----|-----|
| Type | `CNAME` |
| Name | `@` (또는 도메인 루트) |
| Target | `leeeunseok.tail32c3e2.ts.net` |
| Proxy status | **Proxied** (주황색 구름 활성화) |
| TTL | Auto |

**Save** 클릭

#### Step 3: www 서브도메인 추가 (선택)
| 항목 | 값 |
|-----|-----|
| Type | `CNAME` |
| Name | `www` |
| Target | `leeeunseok.tail32c3e2.ts.net` |
| Proxy status | **Proxied** |

### 5.5 SSL/TLS 설정

#### Step 1: SSL/TLS 메뉴로 이동
왼쪽 메뉴에서 **SSL/TLS** > **Overview** 클릭

#### Step 2: 암호화 모드 설정
**Full (strict)** 선택

> **중요**: "Flexible"을 선택하면 보안 취약점이 발생할 수 있습니다.

### 5.6 보안 설정

#### Step 1: Security 메뉴로 이동
왼쪽 메뉴에서 **Security** > **Settings** 클릭

#### Step 2: 아래와 같이 설정

| 항목 | 권장 값 |
|-----|--------|
| Security Level | Medium |
| Challenge Passage | 30 minutes |
| Browser Integrity Check | On |

#### Step 3: WAF 활성화
**Security** > **WAF** 클릭
- **Managed Rules** 탭에서 규칙 활성화

### 5.7 캐싱 설정

#### Step 1: Caching 메뉴로 이동
**Caching** > **Configuration** 클릭

#### Step 2: 설정

| 항목 | 권장 값 |
|-----|--------|
| Caching Level | Standard |
| Browser Cache TTL | 4 hours |

### 5.8 API 경로 캐싱 제외

API 요청은 캐싱하면 안 됩니다.

#### Step 1: Page Rules 설정
**Rules** > **Page Rules** 클릭

#### Step 2: 규칙 추가
**Create Page Rule** 클릭

| 항목 | 값 |
|-----|-----|
| URL | `*gagisiro.com/api/*` |
| Setting | Cache Level |
| Value | Bypass |

**Save and Deploy** 클릭

### 5.9 설정 확인

1. 브라우저에서 `https://gagisiro.com` 접속
2. 정상적으로 사이트가 표시되는지 확인
3. 개발자 도구(F12) > Network 탭에서 응답 헤더에 `cf-ray`가 있는지 확인

---

## 6. 개발 환경 설정

> 로컬 개발 환경에서 테스트 및 분석 도구를 사용하기 위한 설정입니다.

### 6.1 의존성 설치

```bash
cd frontend
npm install
```

> **Note**: `@playwright/test`, `rollup-plugin-visualizer`, `@vitest/coverage-v8`가 이미 package.json에 포함되어 있습니다.

### 6.2 Playwright 브라우저 설치

E2E 테스트를 위해 Chromium 브라우저를 설치합니다:

```bash
npx playwright install chromium
```

설치 확인:
```bash
npx playwright --version
```

### 6.3 E2E 테스트 실행

```bash
# 헤드리스 모드로 실행
npm run test:e2e

# UI 모드로 실행 (브라우저에서 테스트 과정 확인)
npm run test:e2e:ui

# 테스트 리포트 보기
npm run test:e2e:report
```

### 6.4 번들 사이즈 분석

```bash
# Windows
set ANALYZE=true && npm run build

# Mac/Linux
ANALYZE=true npm run build

# 또는 npm script 사용
npm run build:analyze
```

`bundle-stats.html` 파일이 생성되고 브라우저에서 자동으로 열립니다.

### 6.5 테스트 커버리지 확인

```bash
npm run test:coverage
```

`coverage/` 폴더에 리포트가 생성됩니다.
`coverage/index.html`을 브라우저에서 열어 상세 커버리지를 확인할 수 있습니다.

---

## 체크리스트

### 필수 설정 (반드시 완료)
- [ ] GitHub Secrets 등록 완료
  - [ ] `PI_HOST`
  - [ ] `PI_USERNAME`
  - [ ] `PI_SSH_KEY`
  - [ ] `PI_PORT`
  - [ ] `HEALTH_CHECK_URL`
  - [ ] `VITE_API_URL`
- [ ] 외부 모니터링 설정 (UptimeRobot 또는 BetterStack)
- [ ] Grafana 기본 비밀번호 변경

### 권장 설정
- [ ] rclone Google Drive 연동
- [ ] 원격 백업 cron 설정 (매일 새벽 4시)
- [ ] Cloudflare DNS 설정 (커스텀 도메인 사용 시)
- [ ] Codecov 연동 (테스트 커버리지 시각화)

### 개발 환경
- [ ] `cd frontend && npm install` 실행
- [ ] `npx playwright install chromium` 실행

---

## 문제 해결

### GitHub Actions 배포가 실패해요

**증상**: `Permission denied (publickey)` 오류

**해결 방법**:
1. SSH 키가 올바르게 등록되었는지 확인
   ```bash
   # 라즈베리파이에서 확인
   cat ~/.ssh/authorized_keys
   ```
2. 개인키 전체(`-----BEGIN...` 부터 `-----END...` 까지)가 GitHub Secrets에 등록되었는지 확인
3. Tailscale이 실행 중인지 확인:
   ```bash
   tailscale status
   ```

---

### rclone 인증이 만료되었어요

**증상**: `Failed to configure token: oauth2: token expired` 오류

**해결 방법**:
```bash
rclone config reconnect gdrive:
```
다시 인증 과정을 진행합니다.

---

### Grafana에 접속이 안 돼요

**증상**: `http://<IP>:3001` 접속 시 응답 없음

**해결 방법**:
1. 컨테이너 상태 확인:
   ```bash
   docker ps | grep grafana
   ```
2. 컨테이너가 없으면 다시 실행:
   ```bash
   cd ~/side
   docker compose -f docker-compose.monitoring.yml up -d
   ```
3. 로그 확인:
   ```bash
   docker logs grafana
   ```

---

### Cloudflare 설정 후 사이트가 안 열려요

**증상**: `ERR_TOO_MANY_REDIRECTS` 오류

**해결 방법**:
1. Cloudflare > SSL/TLS > Overview
2. **Full (strict)** 선택 (Flexible이 아닌지 확인)

**증상**: `522 Connection timed out` 오류

**해결 방법**:
1. Tailscale Funnel이 실행 중인지 확인:
   ```bash
   tailscale serve status
   ```
2. CNAME Target이 올바른지 확인

---

### 백업이 안 돼요

**증상**: `/var/log/backup-remote.log`에 오류 발생

**해결 방법**:
1. rclone 연결 테스트:
   ```bash
   rclone lsd gdrive:
   ```
2. 연결 실패 시 재인증:
   ```bash
   rclone config reconnect gdrive:
   ```
3. 백업 디렉토리 확인:
   ```bash
   ls -la ~/backups/
   ```

---

## 참고 링크

| 서비스 | 문서 링크 |
|--------|----------|
| GitHub Actions | [docs.github.com/actions](https://docs.github.com/en/actions) |
| rclone | [rclone.org/docs](https://rclone.org/docs/) |
| Cloudflare | [developers.cloudflare.com](https://developers.cloudflare.com/) |
| Grafana | [grafana.com/docs](https://grafana.com/docs/) |
| Playwright | [playwright.dev/docs](https://playwright.dev/docs/intro) |
| UptimeRobot | [uptimerobot.com/help](https://uptimerobot.com/help/) |
| Tailscale Funnel | [tailscale.com/kb/funnel](https://tailscale.com/kb/1223/funnel) |

---

## 도움이 필요하신가요?

- 이슈 리포트: [GitHub Issues](https://github.com/doublesilver/side/issues)
- Tailscale 커뮤니티: [tailscale.com/community](https://tailscale.com/community)
