import logging


def pytest_addoption(parser):
    parser.addoption(
        "--no-linting",
        action="store_true",
        default=False,
        help="Skip linting checks",
    )
    parser.addoption(
        "--linting",
        action="store_true",
        default=False,
        help="Only run linting checks",
    )


def pytest_collection_modifyitems(session, config, items):
    if config.getoption("--no-linting"):
        items[:] = [item for item in items if not item.get_closest_marker('flake8')]
    if config.getoption("--linting"):
        items[:] = [item for item in items if item.get_closest_marker('flake8')]


def pytest_configure(config):
    """Flake8 is very verbose by default. Silence it."""
    logging.getLogger("flake8").setLevel(logging.WARNING)
