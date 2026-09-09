FROM php:8.4-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    nodejs \
    npm \
    sqlite \
    sqlite-dev \
    postgresql-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    bash \
    openssl \
    oniguruma-dev

# Generate self-signed SSL Certificate
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/nginx-selfsigned.key \
    -out /etc/ssl/certs/nginx-selfsigned.crt \
    -subj "/C=GB/ST=London/L=London/O=Pudding London/CN=localhost"

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd pdo pdo_mysql pdo_sqlite pdo_pgsql pgsql pcntl zip bcmath opcache mbstring

# Get Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy application files
COPY . .

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Install Node dependencies and compile assets
RUN npm install && npm run build

# Setup storage and database permissions
RUN mkdir -p database storage/framework/{sessions,views,caches} \
    && chown -R www-data:www-data storage database bootstrap/cache \
    && chmod -R 775 storage database bootstrap/cache

# Copy docker configs
COPY .docker/nginx-origin.crt /etc/ssl/certs/nginx-origin.crt
COPY .docker/nginx-origin.key /etc/ssl/private/nginx-origin.key
COPY .docker/nginx.conf /etc/nginx/http.d/default.conf
COPY .docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose ports for web server and Reverb WebSocket
EXPOSE 80 8080

# Run migrations, link storage, repair mounted volume permissions, and start supervisord
CMD php artisan migrate --force && php artisan storage:link --force && chown -R www-data:www-data storage database bootstrap/cache && chmod -R 775 storage database bootstrap/cache && /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
