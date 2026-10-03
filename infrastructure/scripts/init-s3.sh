#!/bin/sh
# =============================================================================
# RoadGuard AI - S3 bucket provisioning
# =============================================================================
# One-shot job: waits for the object-storage endpoint to become reachable and
# creates the buckets the application expects.
#
# Implemented as a mounted script rather than an inline `entrypoint:` in the
# compose file. Quoting a shell program inside YAML, then inside `sh -c`, then
# inside Compose's own `$$` escaping, is fragile - an inner single-quoted string
# silently suppresses variable expansion and yields literal "$S3_ENDPOINT".
#
# Deliberately uses the AWS CLI rather than `mc`: `mc` is coupled to MinIO,
# whereas the AWS CLI speaks plain S3 and works against MinIO, S3Mock, or any
# other S3-compatible endpoint via S3_ENDPOINT.
# =============================================================================
set -eu

ENDPOINT="${S3_ENDPOINT:-http://minio:9000}"
REGION="${AWS_DEFAULT_REGION:-us-east-1}"
TIMEOUT_SECONDS="${S3_INIT_TIMEOUT:-120}"

echo "[init-s3] Waiting for S3 endpoint at ${ENDPOINT} (timeout ${TIMEOUT_SECONDS}s)..."

waited=0
until aws s3 ls --endpoint-url "${ENDPOINT}" >/dev/null 2>&1; do
    if [ "${waited}" -ge "${TIMEOUT_SECONDS}" ]; then
        echo "[init-s3] ERROR: endpoint ${ENDPOINT} not reachable after ${TIMEOUT_SECONDS}s" >&2
        exit 1
    fi
    echo "[init-s3]   not ready, retrying in 2s"
    sleep 2
    waited=$((waited + 2))
done

echo "[init-s3] S3 endpoint reachable."

create_bucket() {
    bucket="$1"
    attempt=1
    max_attempts=5
    while [ "${attempt}" -le "${max_attempts}" ]; do
        # Retry once without the location constraint: real AWS S3 rejects
        # --create-bucket-request-location for us-east-1 (its default), and some
        # S3-compatible servers reject the constraint outright.
        if aws s3 mb --endpoint-url "${ENDPOINT}" \
                "s3://${bucket}" --create-bucket-request-location "${REGION}" >/dev/null 2>&1 \
           || aws s3 mb --endpoint-url "${ENDPOINT}" "s3://${bucket}" >/dev/null 2>&1; then
            echo "[init-s3]   created bucket '${bucket}'"
            return 0
        fi
        echo "[init-s3]   attempt ${attempt}/${max_attempts} for '${bucket}' failed, retrying in 2s"
        sleep 2
        attempt=$((attempt + 1))
    done
    echo "[init-s3] ERROR: could not create bucket '${bucket}'" >&2
    return 1
}

# Buckets are passed as a whitespace-separated list so adding one needs no
# compose change: BUCKETS="a b c".
for bucket in ${BUCKETS:-}; do
    if [ -z "${bucket}" ]; then
        continue
    fi
    if aws s3api head-bucket --endpoint-url "${ENDPOINT}" --bucket "${bucket}" >/dev/null 2>&1; then
        echo "[init-s3]   bucket '${bucket}' already exists"
        continue
    fi
    create_bucket "${bucket}"
done

echo "[init-s3] S3 buckets ready:"
aws s3 ls --endpoint-url "${ENDPOINT}"