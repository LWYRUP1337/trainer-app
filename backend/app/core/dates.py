from datetime import UTC, date, datetime, timedelta

LATEST_UTC_OFFSET = timedelta(hours=14)


def latest_local_date() -> date:
    return (datetime.now(UTC) + LATEST_UTC_OFFSET).date()
