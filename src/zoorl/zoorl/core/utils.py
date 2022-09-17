import hashlib

from datetime import datetime, timedelta

def compute_epoch_time_from_ttl(hours_from_now: int) -> int:
    """Compute the UNIX epoch time from 'now' up to the specified amount of hours"""
    now = get_now()

    time_delta = timedelta(hours=hours_from_now)
    ttl_date = now + time_delta
    return int(ttl_date.timestamp())

def compute_hash(url: str) -> str:
    """Compute the hash of a given URL as Base62-encoded string"""
    hash = int(hashlib.sha256(url.encode('utf-8')).hexdigest(), 16) % 10**12

    return to_base_62(hash)


BASE62_ENCODING_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

def to_base_62(some_number: int) -> str:
    """Encode a number into its Base62 representation"""
    hash_str = ""

    while some_number > 0:
       hash_str = BASE62_ENCODING_CHARS[some_number % 62] + hash_str
       some_number //= 62
    return hash_str

def get_now() -> datetime:
    """Compute this instant (this is needed for testing, since we cannot mock datetime built-in type)"""
    return datetime.now()
