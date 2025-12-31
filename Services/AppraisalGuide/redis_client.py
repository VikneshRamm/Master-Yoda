import redis

redis_client = redis.Redis(
    host="localhost",
    port=6379,
    decode_responses=True  # IMPORTANT: store JSON as strings
)
