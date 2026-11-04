#!/usr/bin/env bash
# Run WP-CLI against the local demo WordPress container.
docker run --rm --user 33:33 --volumes-from demo-wordpress-1 --network demo_default \
  -e WORDPRESS_DB_HOST=db -e WORDPRESS_DB_NAME=wordpress -e WORDPRESS_DB_USER=wpuser \
  -e WORDPRESS_DB_PASSWORD=demo-only-password wordpress:cli wp --path=/var/www/html "$@"
