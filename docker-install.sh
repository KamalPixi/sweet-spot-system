#!/bin/bash

# Pudding London Docker Install Script
# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0;35m' # No Color
CLEAR='\033[0m'

echo -e "${BLUE}===============================================${CLEAR}"
echo -e "${BLUE}   Pudding London - Docker Install Assistant   ${CLEAR}"
echo -e "${BLUE}===============================================${CLEAR}"

# Check if Docker is installed and running
if ! [ -x "$(command -v docker)" ]; then
  echo -e "${RED}Error: docker is not installed. Please install Docker before running this script.${CLEAR}"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo -e "${RED}Error: Docker daemon is not running. Please start Docker Desktop/daemon.${CLEAR}"
  exit 1
fi

# 1. Setup local env file if missing
if [ ! -f .env ]; then
  echo -e "${YELLOW}Creating .env file from .env.example...${CLEAR}"
  cp .env.example .env
  
  # Configure the .env file for PostgreSQL out of the box in Docker
  sed -i '' 's/DB_CONNECTION=sqlite/DB_CONNECTION=pgsql/g' .env 2>/dev/null || sed -i 's/DB_CONNECTION=sqlite/DB_CONNECTION=pgsql/g' .env
  sed -i '' 's/DB_HOST=127.0.0.1/DB_HOST=db/g' .env 2>/dev/null || sed -i 's/DB_HOST=127.0.0.1/DB_HOST=db/g' .env
  sed -i '' 's/DB_PORT=3306/DB_PORT=5432/g' .env 2>/dev/null || sed -i 's/DB_PORT=3306/DB_PORT=5432/g' .env
  sed -i '' 's/DB_DATABASE=laravel/DB_DATABASE=pudding_london/g' .env 2>/dev/null || sed -i 's/DB_DATABASE=laravel/DB_DATABASE=pudding_london/g' .env
  sed -i '' 's/DB_USERNAME=root/DB_USERNAME=pudding_user/g' .env 2>/dev/null || sed -i 's/DB_USERNAME=root/DB_USERNAME=pudding_user/g' .env
  sed -i '' 's/DB_PASSWORD=/DB_PASSWORD=pudding_secure_pass/g' .env 2>/dev/null || sed -i 's/DB_PASSWORD=/DB_PASSWORD=pudding_secure_pass/g' .env
else
  echo -e "${GREEN}.env file already exists. Skipping copy.${CLEAR}"
fi

# 2. Build and start containers
echo -e "${YELLOW}Building and starting Docker containers...${CLEAR}"
docker compose down
docker compose up -d --build

# Wait for database to initialize
echo -e "${YELLOW}Waiting for PostgreSQL to start up...${CLEAR}"
sleep 5

# 3. Setup key & run migrations/seeding
echo -e "${YELLOW}Generating app encryption key...${CLEAR}"
docker compose exec app php artisan key:generate --force
echo -e "${YELLOW}Seeding database (Admin, categories, products, FAQs)...${CLEAR}"
docker compose exec app php artisan db:seed --force

echo -e "${GREEN}===============================================${CLEAR}"
echo -e "${GREEN}   Setup Complete! Pudding London is Running!  ${CLEAR}"
echo -e "${GREEN}===============================================${CLEAR}"
echo -e "${BLUE}  🌐 HTTP Web URL:        http://localhost${CLEAR}"
echo -e "${BLUE}  🔒 HTTPS Web URL:       https://localhost${CLEAR}"
echo -e ""
echo -e "${YELLOW}Default Admin Credentials:${CLEAR}"
echo -e "  - Email:    admin@pudding.london"
echo -e "  - Password: adminpassword"
echo -e "==============================================="
