#!/usr/bin/env bash
# First-timer verification for the church registration stack.
# Run on the server where the docker containers live.
#
#   ./first_timers.sh today     # list today's genuine first-timers
#   ./first_timers.sh compare   # true first-timers vs stale-flagged attendees
#   ./first_timers.sh check     # confirm the fixed code is deployed (expect 0)
#   ./first_timers.sh cleanup   # clear first_time for saints with >1 attendance
#
# Containers are overridable: APP_CONTAINER=... DB_CONTAINER=... ./first_timers.sh today

set -euo pipefail

APP_CONTAINER="${APP_CONTAINER:-church_api}"
DB_CONTAINER="${DB_CONTAINER:-church_db}"

usage() {
  sed -n '2,8p' "$0"
  exit 1
}

psqlq() {
  printf '%s\n' "$1" | docker exec -i "$DB_CONTAINER" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
}

TODAY_LIST_SQL="SELECT s.first_name, s.last_name, s.phone_number, MIN(a.service_date)::text AS first_visit
FROM attendance a
JOIN saints s ON s.id = a.saint_id
WHERE a.service_date = CURRENT_DATE
GROUP BY s.id, s.first_name, s.last_name, s.phone_number
HAVING MIN(a.service_date) = CURRENT_DATE;"

COMPARE_SQL="SELECT
  (SELECT count(*) FROM attendance a JOIN saints s ON s.id = a.saint_id
   WHERE a.service_date = CURRENT_DATE
     AND (SELECT count(*) FROM attendance x WHERE x.saint_id = s.id) = 1) AS true_first_timers,
  (SELECT count(*) FROM attendance a JOIN saints s ON s.id = a.saint_id
   WHERE a.service_date = CURRENT_DATE AND s.first_time) AS flagged_attending;"

CLEANUP_SQL="UPDATE saints s SET first_time = FALSE
WHERE s.first_time
  AND (SELECT count(*) FROM attendance a WHERE a.saint_id = s.id) > 1;"

case "${1:-}" in
  today)
    psqlq "$TODAY_LIST_SQL"
    ;;
  compare)
    psqlq "$COMPARE_SQL"
    ;;
  check)
    echo "lines still containing old auto-clear (expect 0):"
    docker exec "$APP_CONTAINER" grep -c "total >= 2" /app/src/services/checkin_service.py
    ;;
  cleanup)
    echo "Clearing first_time for saints with more than one attendance:"
    psqlq "$CLEANUP_SQL"
    ;;
  *)
    usage
    ;;
esac
