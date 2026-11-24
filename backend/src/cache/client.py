import redis.asyncio as redis
from redis.exceptions import RedisError
from src.config import config

redis_client = redis.from_url(config.redis.url, decode_responses=True)


async def get_cached(key: str) -> str | None:
    try:
        return await redis_client.get(key)
    except RedisError:
        return None


async def set_cached(key: str, value: str, ttl_seconds: int = 60) -> None:
    try:
        await redis_client.set(key, value, ex=ttl_seconds)
    except RedisError:
        pass


async def invalidate_dashboard() -> None:
    try:
        await redis_client.delete("dashboard")
    except RedisError:
        pass
