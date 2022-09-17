import pytest
from pytest_mock import MockerFixture

from datetime import datetime

import zoorl.core.utils as utils

compute_hash_test_data = [
    ("http://www.google.com", "bJd4bYF"),
    ("https://jasonwatmore.com/post/2019/11/21/angular-http-post-request-examples", "3ZlbRMf")
]

@pytest.mark.parametrize("url,expected_hash", compute_hash_test_data)
def test_compute_hash(url, expected_hash) -> None:
    hash = utils.compute_hash(url)

    print(f"{url} ==> {hash}")
    assert hash == expected_hash


compute_epoch_time_from_ttl_test_data = [
    (datetime(2021, 7, 24, 17, 30), 1, datetime(2021, 7, 24, 18, 30)),
    (datetime(2021, 7, 1, 17, 30), 24, datetime(2021, 7, 2, 17, 30))
]
@pytest.mark.parametrize("now_datetime,number_of_hours,expected_datetime", compute_epoch_time_from_ttl_test_data)
def test_compute_epoch_time_from_ttl(mocker: MockerFixture, now_datetime: datetime, number_of_hours: int, expected_datetime: datetime) -> None:
    mocker.patch.object(utils, "get_now", return_value=now_datetime)

    computed_ttl = utils.compute_epoch_time_from_ttl(number_of_hours)
    assert computed_ttl == expected_datetime.timestamp()