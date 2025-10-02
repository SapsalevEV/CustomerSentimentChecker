# Руководство по развертыванию Actionable Sentiment на удаленном сервере

Пошаговая инструкция по развертыванию приложения в Docker контейнере на сервере `193.233.102.193`.

---

## Содержание

1. [Подготовка локальной машины](#1-подготовка-локальной-машины)
2. [Настройка удаленного сервера](#2-настройка-удаленного-сервера)
3. [Установка Docker на сервере](#3-установка-docker-на-сервере)
4. [Настройка проекта на сервере](#4-настройка-проекта-на-сервере)
5. [Настройка GitHub Actions CI/CD](#5-настройка-github-actions-cicd)
6. [Первый деплой](#6-первый-деплой)
7. [Проверка работы](#7-проверка-работы)
8. [Обслуживание и мониторинг](#8-обслуживание-и-мониторинг)

---

## 1. Подготовка локальной машины

### 1.1. Генерация SSH ключа (если еще не создан)

```bash
# Генерация SSH ключа
ssh-keygen -t ed25519 -C "your_email@example.com" -f ~/.ssh/actionable_sentiment_deploy

# Выведите публичный ключ (понадобится для сервера)
cat ~/.ssh/actionable_sentiment_deploy.pub
```

### 1.2. Создание учетной записи на Docker Hub

1. Зарегистрируйтесь на https://hub.docker.com/
2. Создайте Access Token:
   - Settings → Security → New Access Token
   - Сохраните токен (понадобится для GitHub Actions)

---

## 2. Настройка удаленного сервера

### 2.1. Подключение к серверу

```bash
# Первое подключение (с паролем)
ssh root@193.233.102.193
```

### 2.2. Обновление системы

```bash
# Обновление пакетов
apt update && apt upgrade -y

# Установка базовых утилит
apt install -y curl wget git nano ufw
```

### 2.3. Создание пользователя для деплоя

```bash
# Создание пользователя
adduser deploy
# Введите пароль и информацию о пользователе

# Добавление пользователя в sudo группу
usermod -aG sudo deploy

# Переключение на пользователя deploy
su - deploy
```

### 2.4. Настройка SSH доступа

```bash
# Создание директории для SSH ключей
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Добавление публичного ключа (скопируйте из локальной машины)
nano ~/.ssh/authorized_keys
# Вставьте содержимое файла ~/.ssh/actionable_sentiment_deploy.pub

# Установка правильных прав
chmod 600 ~/.ssh/authorized_keys
```

### 2.5. Настройка Firewall (UFW)

```bash
# Выход из пользователя deploy (возврат к root)
exit

# Разрешение SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8000/tcp  # Для backend API

# Включение firewall
ufw --force enable

# Проверка статуса
ufw status
```

### 2.6. Тестирование SSH подключения

С локальной машины:

```bash
# Тест подключения с ключом
ssh -i ~/.ssh/actionable_sentiment_deploy deploy@193.233.102.193

# Если работает, добавьте конфигурацию в ~/.ssh/config
nano ~/.ssh/config
```

Добавьте:

```
Host actionable-prod
    HostName 193.233.102.193
    User deploy
    IdentityFile ~/.ssh/actionable_sentiment_deploy
    StrictHostKeyChecking no
```

Теперь можно подключаться: `ssh actionable-prod`

---

## 3. Установка Docker на сервере

### 3.1. Подключение к серверу

```bash
ssh actionable-prod
```

### 3.2. Установка Docker

```bash
# Удаление старых версий (если есть)
sudo apt remove docker docker-engine docker.io containerd runc

# Установка зависимостей
sudo apt update
sudo apt install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Добавление официального GPG ключа Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Добавление репозитория Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu 
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Установка Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Проверка установки
docker --version
docker compose version
```

### 3.3. Настройка прав для пользователя deploy

```bash
# Добавление пользователя в группу docker
sudo usermod -aG docker deploy

# Перезапуск сессии (выйти и войти обратно)
exit
ssh actionable-prod

# Проверка работы без sudo
docker ps
```

### 3.4. Включение автозапуска Docker

```bash
sudo systemctl enable docker
sudo systemctl start docker
sudo systemctl status docker
```

---

## 4. Настройка проекта на сервере

### 4.1. Создание директории проекта

```bash
# Создание директории
sudo mkdir -p /opt/actionable-sentiment
sudo chown deploy:deploy /opt/actionable-sentiment
cd /opt/actionable-sentiment
```

### 4.2. Создание docker-compose.yml

```bash
nano docker-compose.yml
```

Вставьте содержимое:

```yaml
version: '3.8'

services:
  frontend:
    image: esapsalev/actionable-sentiment:latest
    container_name: actionable-sentiment-frontend
    ports:
      - "80:80"
    restart: unless-stopped
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s

networks:
  app-network:
    driver: bridge
```

**Замените** `YOUR_DOCKERHUB_USERNAME` на ваш логин Docker Hub.

### 4.3. Авторизация в Docker Hub (на сервере)

```bash
docker login
# Введите username и password от Docker Hub
```

---

## 5. Настройка GitHub Actions CI/CD

### 5.1. Добавление Secrets в GitHub репозиторий

1. Откройте репозиторий на GitHub
2. Перейдите в **Settings** → **Secrets and variables** → **Actions**
3. Нажмите **New repository secret** и добавьте:

| Secret Name        | Value                                              |
|--------------------|----------------------------------------------------|
| `DOCKER_USERNAME`  | Ваш логин на Docker Hub                            |
| `DOCKER_PASSWORD`  | Access Token из Docker Hub (шаг 1.2)              |
| `SERVER_USER`      | `deploy`                                           |
| `SSH_PRIVATE_KEY`  | Приватный ключ `~/.ssh/actionable_sentiment_deploy` |

**Для SSH_PRIVATE_KEY:**

```bash
# На локальной машине
cat ~/.ssh/actionable_sentiment_deploy
# Скопируйте ВСЕ содержимое (включая BEGIN и END строки)
```

### 5.2. Обновление docker-compose.yml в репозитории

Отредактируйте `docker-compose.yml` в корне проекта:

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        VITE_API_BASE_URL: http://193.233.102.193:8000
    image: YOUR_DOCKERHUB_USERNAME/actionable-sentiment:latest
    container_name: actionable-sentiment-frontend
    ports:
      - "80:80"
    restart: unless-stopped
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s

networks:
  app-network:
    driver: bridge
```

### 5.3. Коммит и пуш файлов

```bash
# На локальной машине
git add Dockerfile docker-compose.yml nginx.conf .dockerignore .github/workflows/deploy.yml
git commit -m "Add Docker deployment configuration"
git push origin main
```

---

## 6. Первый деплой

### 6.1. Автоматический деплой через GitHub Actions

После пуша в `main` ветку:

1. Откройте GitHub → **Actions**
2. Должен запуститься workflow **"Build and Deploy to Production"**
3. Следите за логами выполнения

### 6.2. Ручной деплой (если нужно)

Если хотите запустить вручную:

```bash
# На сервере
cd /opt/actionable-sentiment

# Остановка контейнеров
docker compose down

# Получение последнего образа
docker pull YOUR_DOCKERHUB_USERNAME/actionable-sentiment:latest

# Запуск
docker compose up -d

# Просмотр логов
docker compose logs -f
```

---

## 7. Проверка работы

### 7.1. Проверка контейнера

```bash
# На сервере
docker ps
# Должен показать запущенный контейнер actionable-sentiment-frontend

# Проверка логов
docker compose logs -f frontend

# Проверка health check
docker inspect actionable-sentiment-frontend | grep -A 10 Health
```

### 7.2. Проверка доступности

С локальной машины:

```bash
# Health check endpoint
curl http://193.233.102.193/health

# Главная страница
curl -I http://193.233.102.193/
```

В браузере откройте:
```
http://193.233.102.193
```

### 7.3. Проверка API интеграции

1. Откройте приложение в браузере
2. Перейдите на Dashboard
3. Проверьте, что данные загружаются с бэкенда (`http://193.233.102.193:8000`)

---

## 8. Обслуживание и мониторинг

### 8.1. Основные команды Docker

```bash
# Просмотр запущенных контейнеров
docker ps

# Просмотр всех контейнеров
docker ps -a

# Логи контейнера
docker compose logs -f

# Рестарт контейнера
docker compose restart

# Остановка
docker compose down

# Запуск
docker compose up -d

# Статус healthcheck
docker inspect --format='{{json .State.Health}}' actionable-sentiment-frontend | jq
```

### 8.2. Обновление приложения

```bash
# Просто сделайте git push в main ветку
git push origin main

# GitHub Actions автоматически:
# 1. Соберет новый образ
# 2. Загрузит в Docker Hub
# 3. Задеплоит на сервер
```

### 8.3. Откат к предыдущей версии

```bash
# На сервере
cd /opt/actionable-sentiment

# Найдите SHA предыдущего коммита на GitHub
docker pull YOUR_DOCKERHUB_USERNAME/actionable-sentiment:COMMIT_SHA

# Обновите docker-compose.yml, замените :latest на :COMMIT_SHA

# Перезапуск
docker compose down
docker compose up -d
```

### 8.4. Просмотр использования ресурсов

```bash
# Статистика контейнеров в реальном времени
docker stats

# Использование диска
docker system df

# Очистка неиспользуемых образов
docker image prune -a
```

### 8.5. Логи и отладка

```bash
# Логи в реальном времени
docker compose logs -f

# Последние 100 строк
docker compose logs --tail=100

# Вход в контейнер для отладки
docker exec -it actionable-sentiment-frontend sh

# Внутри контейнера можно проверить:
ls -la /usr/share/nginx/html  # Файлы приложения
cat /etc/nginx/conf.d/default.conf  # Конфигурация nginx
```

---

## Troubleshooting

### Проблема: Контейнер не запускается

```bash
# Проверка логов
docker compose logs

# Проверка конфигурации
docker compose config

# Пересборка образа
docker compose build --no-cache
docker compose up -d
```

### Проблема: Не доступен из интернета

```bash
# Проверка firewall
sudo ufw status

# Проверка, слушает ли порт 80
sudo netstat -tlnp | grep :80

# Проверка маршрутизации
curl localhost:80
curl 193.233.102.193:80
```

### Проблема: GitHub Actions не может подключиться

1. Проверьте SSH ключ в Secrets
2. Убедитесь, что ключ добавлен на сервере в `~/.ssh/authorized_keys`
3. Проверьте права: `chmod 600 ~/.ssh/authorized_keys`

### Проблема: Приложение не видит API

1. Проверьте, что бэкенд работает: `curl http://193.233.102.193:8000/health`
2. Проверьте переменную `VITE_API_BASE_URL` в Dockerfile
3. Пересоберите образ: `docker compose build --no-cache`

---

## Безопасность (дополнительно)

### Настройка SSL/HTTPS с Let's Encrypt

```bash
# Установка Certbot
sudo apt install -y certbot

# Получение сертификата (если есть домен)
sudo certbot certonly --standalone -d yourdomain.com

# Обновление nginx.conf для HTTPS
# Добавьте в docker-compose.yml монтирование сертификатов
```

### Автоматические обновления безопасности

```bash
# Установка unattended-upgrades
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

---

## Контрольный список деплоя

- [ ] SSH ключ создан и добавлен на сервер
- [ ] Docker и Docker Compose установлены на сервере
- [ ] Firewall настроен (порты 22, 80, 443, 8000)
- [ ] Пользователь `deploy` создан и добавлен в группу `docker`
- [ ] Директория `/opt/actionable-sentiment` создана
- [ ] Docker Hub аккаунт создан
- [ ] GitHub Secrets добавлены (DOCKER_USERNAME, DOCKER_PASSWORD, SERVER_USER, SSH_PRIVATE_KEY)
- [ ] docker-compose.yml на сервере обновлен с правильным Docker Hub username
- [ ] GitHub Actions workflow запустился успешно
- [ ] Приложение доступно по http://193.233.102.193
- [ ] API интеграция работает (данные загружаются с бэкенда)

---

## Полезные ссылки

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

**Готово!** Теперь при каждом пуше в `main` приложение будет автоматически деплоиться на сервер.
