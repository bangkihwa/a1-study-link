# 원격 접근 운영 가이드

## 1. 개요
- 로컬 Docker 환경을 외부에서 테스트할 때 ngrok을 통해 Nginx(포트 80)를 노출하는 구성을 전제로 합니다.
- 핵심 확인 대상은 MySQL 권한, 백엔드 환경 변수, API 헬스 상태입니다.
- 아래 절차는 운영 데이터가 없는 테스트 환경 기준이며, 운영 환경에서는 백업 후 작업하십시오.

## 2. Docker 서비스 상태 확인
- 컨테이너들이 정상 기동 중인지 우선 점검합니다.
- redis와 backend 이미지는 amd64 기반이므로 Apple Silicon(macOS arm64) 환경에서는 `--platform linux/amd64` 옵션을 docker-compose.yml에 명시하는 것을 권장합니다.

```bash
cd docker
docker compose ps
```

## 3. MySQL 접근 권한 점검
1. 현재 등록된 사용자/호스트 조합 확인
   ```bash
   docker compose exec mysql mysql -uroot -pmysql -e "SELECT User, Host FROM mysql.user;"
   ```
2. 백엔드 컨테이너가 네트워크 내부 IP(예: 172.x.x.x)로 접근하므로 `%` 호스트 권한을 반드시 부여합니다.
   ```bash
   docker compose exec mysql mysql -uroot -pmysql -e \
     "CREATE USER IF NOT EXISTS 'a1_app'@'%' IDENTIFIED BY 'mysql';
      GRANT ALL PRIVILEGES ON a1_studylink.* TO 'a1_app'@'%';
      FLUSH PRIVILEGES;"
   ```
3. 데이터 볼륨 초기화가 필요하다면 사전에 덤프를 보관하고 아래 명령으로 재생성합니다.
   ```bash
   docker compose down
   docker volume rm docker_mysql_data
   docker compose up -d
   ```

## 4. 백엔드 환경 변수 확인
- backend 컨테이너 내부 변수에서 `DB_USER=a1_app`, `DB_HOST=mysql`, `DB_PASSWORD=mysql` 값을 확인합니다.
- 불일치 시 docker-compose.yml 또는 배포 파이프라인의 환경 변수 주입을 수정한 뒤 컨테이너를 재기동합니다.

```bash
docker compose exec backend env | grep DB_
```

## 5. 서비스 헬스체크 및 로그인 검증
1. readiness와 public 설정 API가 200을 반환하는지 확인합니다.
   ```bash
   curl -i http://localhost/readiness
   curl -i http://localhost/api/public/settings
   ```
2. 관리자 계정으로 로그인 테스트를 수행해 JWT 토큰이 발급되는지 검증합니다.
   ```bash
   curl -i http://localhost/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin"}'
   ```
3. ngrok URL에서도 동일하게 호출하여 외부에서도 정상 동작하는지 교차 확인합니다.
   ```bash
   curl -i https://<your-ngrok-id>.ngrok-free.app/api/public/settings
   ```

## 6. 점검 모드 및 캐시 관련 참고사항
- 점검 모드가 활성화되면 비관리자 계정은 503으로 응답합니다. 관리자 계정으로 `/api/admin/system-settings`를 통해 `maintenanceMode` 값을 조정합니다.
- [`backend/src/services/systemSettingsService.ts`](backend/src/services/systemSettingsService.ts:74)에서 30초 TTL의 캐시를 사용하므로 설정 변경 직후에는 30초 정도 지연이 발생할 수 있습니다.

## 7. 자주 발생하는 오류와 해결책
| 증상 | 원인 | 조치 |
| --- | --- | --- |
| `Host '172.x.x.x' is not allowed to connect to this MySQL server` | MySQL 계정 호스트 제한 | 3. MySQL 접근 권한 점검의 2단계 명령 실행 |
| `/api/public/settings` 503 | DB 연결 실패 또는 점검 모드 | MySQL 권한/환경 변수 재확인, `maintenanceMode` 비활성화 |
| ngrok에서 React 번들만 표시 | `/readiness`가 프록시되어 프론트가 응답 | `/api/public/settings` 등 API 엔드포인트 호출로 검증 |

## 8. 참고 명령어 요약
```bash
# 컨테이너 재기동
docker compose up -d --force-recreate backend

# 백엔드 로그 tail
docker compose logs backend --tail 200

# ngrok 세션 확인 (별도 터미널)
ngrok http 80
```
