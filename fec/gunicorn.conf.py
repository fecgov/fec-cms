import cfenv

env = cfenv.AppEnv()

workers = int(env.get_credential('GUNICORN_WORKERS', 6))
worker_class = 'gevent'
max_requests = int(env.get_credential('GUNICORN_MAX_REQUESTS', 1000))
max_requests_jitter = int(env.get_credential('GUNICORN_MAX_REQUESTS_JITTER', 200))
timeout = int(env.get_credential('GUNICORN_TIMEOUT', 30))
