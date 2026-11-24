"""Keyless CPI-U snapshots with a strict prior-day cutoff. No credential access."""
import csv
from datetime import date, datetime, timedelta
from decimal import Decimal, InvalidOperation
from functools import lru_cache
from hashlib import sha256
from io import StringIO
import re
import time
from urllib.parse import urlencode, urlparse
from urllib.request import urlopen
from zoneinfo import ZoneInfo

SERIES = 'CPIAUCNS'
BLS_SERIES = 'CUUR0000SA0'
MAX_CSV_BYTES = 1_000_000


class CPIDataError(ValueError):
    pass


def eastern_today():
    return datetime.now(ZoneInfo('America/New_York')).date()


def parse_snapshot(raw: bytes, cutoff: date, source_url: str):
    try:
        reader = csv.reader(StringIO(raw.decode('utf-8-sig')))
        header = next(reader)
        if len(header) != 2 or header[0].lower() not in ('date', 'observation_date'):
            raise ValueError
        match = re.fullmatch(SERIES + r'_(\d{8})', header[1])
        if match is None:
            raise ValueError
        vintage = date.fromisoformat(match[1])
        if vintage > cutoff:
            raise ValueError
        values, missing, seen = [], [], set()
        for row in reader:
            if not row:
                continue
            if len(row) != 2:
                raise ValueError
            observed = date.fromisoformat(row[0])
            if observed.day != 1 or observed > vintage or observed in seen:
                raise ValueError
            seen.add(observed)
            if row[1].strip() in ('', '.'):
                missing.append(observed.isoformat())
                continue
            value = Decimal(row[1])
            if not value.is_finite() or value <= 0:
                raise ValueError
            values.append((observed, value))
        if not values:
            raise ValueError
        observed, value = max(values)
    except (ValueError, InvalidOperation, UnicodeError, StopIteration, csv.Error) as exc:
        raise CPIDataError('The CPI service returned no valid point-in-time snapshot for this date. No current-data fallback was used.') from exc
    return {
        'series_id': SERIES, 'bls_series_id': BLS_SERIES,
        'observation_month': observed.isoformat(), 'index_value': str(value),
        'requested_cutoff': cutoff.isoformat(), 'returned_vintage_date': vintage.isoformat(),
        'source_url': source_url, 'source_sha256': sha256(raw).hexdigest(),
        'missing_observation_months': missing,
        'availability_evidence': 'ALFRED vintage at or before prior-day cutoff; daily availability, no same-day admission',
    }


@lru_cache(maxsize=256)
def _download(cutoff: date, cache_hour: int):
    url = 'https://alfred.stlouisfed.org/graph/alfredgraph.csv?' + urlencode({
        'id': SERIES, 'vintage_date': cutoff.isoformat(),
    })
    try:
        with urlopen(url, timeout=15) as response:
            if urlparse(response.url).scheme != 'https' or urlparse(response.url).hostname != 'alfred.stlouisfed.org':
                raise CPIDataError('Unexpected CPI data destination. No alternate service was used.')
            raw = response.read(MAX_CSV_BYTES + 1)
        if len(raw) > MAX_CSV_BYTES:
            raise CPIDataError('The CPI response exceeded the allowed size.')
    except CPIDataError:
        raise
    except (OSError, TimeoutError) as exc:
        # Never expose upstream exception strings or request headers.
        raise CPIDataError('The free CPI data source is unavailable. Retry later; no paid or sample-data fallback was used.') from exc
    return parse_snapshot(raw, cutoff, url)


def cpi_snapshot(reference_date: date):
    if not date(1913, 2, 1) <= reference_date <= eastern_today():
        raise CPIDataError('Published CPI lookup requires a reference date from February 1913 through today (Eastern). Future inflation must be an explicit scenario.')
    return {**_download(reference_date - timedelta(days=1), int(time.time() // 3600)),
            'reference_date': reference_date.isoformat(), 'same_day_publications_excluded': True}
