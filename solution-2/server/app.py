from os import getenv

redis_host = getenv("REDIS_HOST", "localhost")
redis_port = int(getenv("REDIS_PORT", 6379))

# maybe make async or use threads
def main():
    while True:
        # maybe sleep
        # redis lpop
        # process request
        # start publishing responses in redis
        # maybe sleep again
        pass

if __name__ == "__main__":
    main()
