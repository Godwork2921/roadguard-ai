import functools
import inspect
import logging
import time
from typing import Callable, Any

from fastapi import HTTPException

from app.config import settings


def setup_logging() -> None:
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
        format="%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def timeit(func: Callable) -> Callable:
    if inspect.iscoroutinefunction(func):
        @functools.wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
            start = time.perf_counter()
            result = await func(*args, **kwargs)
            elapsed = (time.perf_counter() - start) * 1000
            logger = logging.getLogger(func.__module__)
            logger.debug("%s took %.2f ms", func.__name__, elapsed)
            return result

        return async_wrapper

    @functools.wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = (time.perf_counter() - start) * 1000
        logger = logging.getLogger(func.__module__)
        logger.debug("%s took %.2f ms", func.__name__, elapsed)
        return result

    return wrapper


def validate_image_size(image_bytes: bytes) -> None:
    max_bytes = settings.max_image_size_mb * 1024 * 1024
    if len(image_bytes) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Image exceeds maximum size of {settings.max_image_size_mb} MB.",
        )
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty image data.")
