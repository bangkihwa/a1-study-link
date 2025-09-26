FROM public.ecr.aws/docker/library/node:18-alpine

WORKDIR /app

ARG REACT_APP_API_URL=/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# 의존성 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci

# 소스 코드 복사
COPY . .

# 애플리케이션 빌드
RUN npm run build

# 프로덕션 서버로 serve 사용
RUN npm install -g serve

# 포트 노출
EXPOSE 3000

# 프로덕션 빌드 제공
CMD ["serve", "-s", "build", "-l", "3000"]
