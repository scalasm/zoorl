"""HTTP errors codes used in lambda handlers."""

# use mimetypes library to be certain, e.g., mimetypes.types_map[".json"]

from http.client import BAD_REQUEST

OK = 200
OK_NO_CONTENT = 204

# See https://www.domain.com/blog/what-is-a-redirect
MOVED_PERMANENTLY = 301

BAD_REQUEST = 400

NOT_FOUND = 404

INTERNAL_SERVER_ERROR = 500
