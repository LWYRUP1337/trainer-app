from typing import Any


class AppError(Exception):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        headers: dict[str, str] | None = None,
        **extra: Any,
    ):
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.headers = headers
        self.extra = extra


class NotFoundError(AppError):
    def __init__(self, message: str):
        super().__init__(404, "not_found", message)


class UnauthorizedError(AppError):
    def __init__(self, message: str):
        super().__init__(401, "unauthorized", message, headers={"WWW-Authenticate": "Bearer"})


class ConflictError(AppError):
    def __init__(self, code: str, message: str, **extra: Any):
        super().__init__(409, code, message, **extra)


class BusinessValidationError(AppError):
    def __init__(self, code: str, message: str, **extra: Any):
        super().__init__(422, code, message, **extra)
