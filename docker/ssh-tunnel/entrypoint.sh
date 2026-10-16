#!/bin/sh
set -eu

apk add --no-cache netcat-openbsd openssh-client

mkdir -p /root/.ssh
cp -a /host-ssh/. /root/.ssh/
chown -R root:root /root/.ssh
chmod 700 /root/.ssh
find /root/.ssh -type d -exec chmod 700 {} +
find /root/.ssh -type f -exec chmod 600 {} +

exec ssh -N \
  -F /dev/null \
  -o "HostName=${RKM_PG_SSH_HOST:-187.127.38.154}" \
  -o "User=${RKM_PG_SSH_USER:-root}" \
  -o IdentitiesOnly=no \
  -o IdentityAgent=/run/ssh-agent \
  -o IdentityFile=/root/.ssh/id_ed25519_rkm \
  -o ExitOnForwardFailure=yes \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=3 \
  -L "0.0.0.0:15432:${RKM_PG_PRIVATE_IP:-172.16.1.6}:5432" \
  rkm
