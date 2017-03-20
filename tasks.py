import os
import json

import git
from invoke import run
from invoke import task
from slacker import Slacker

import cfenv

env = cfenv.AppEnv()


@task
def add_hooks(ctx):
    ctx.run('ln -s ../../bin/post-merge .git/hooks/post-merge')
    ctx.run('ln -s ../../bin/post-checkout .git/hooks/post-checkout')


@task
def remove_hooks(ctx):
    ctx.run('rm .git/hooks/post-merge')
    ctx.run('rm .git/hooks/post-checkout')


def _detect_prod(repo, branch):
    """Deploy to production if master is checked out and tagged."""
    if branch != 'master':
        return False
    try:
        # Equivalent to `git describe --tags --exact-match`
        repo.git().describe('--tags', '--exact-match')
        return True
    except git.exc.GitCommandError:
        return False


def _resolve_rule(repo, branch):
    """Get space associated with first matching rule."""
    for space, rule in DEPLOY_RULES:
        if rule(repo, branch):
            return space
    return None


def _detect_branch(repo):
    try:
        return repo.active_branch.name
    except TypeError:
        return None


def _detect_space(repo, branch=None, yes=False):
    """Detect space from active git branch.

    :param str branch: Optional branch name override
    :param bool yes: Skip confirmation
    :returns: Space name if space is detected and confirmed, else `None`
    """
    space = _resolve_rule(repo, branch)
    if space is None:
        print('No space detected')
        return None
    print('Detected space {space}'.format(**locals()))
    if not yes:
        run = input(
            'Deploy to space {space} (enter "yes" to deploy)? > '.format(**locals())
        )
        if run.lower() not in ['y', 'yes']:
            return None
    return space


DEPLOY_RULES = (
    ('prod', _detect_prod),
    ('stage', lambda _, branch: branch.startswith('release')),
    # ('dev', lambda _, branch: branch == 'develop'),
    # TODO take this out
    ('stage', lambda _, branch: branch == 'feature/gov-cloud-support'),
)


@task
def deploy(ctx, space=None, branch=None, login=None, yes=False):
    """Deploy app to Cloud Foundry. Log in using credentials stored in
    `FEC_CF_USERNAME` and `FEC_CF_PASSWORD`; push to either `space` or the space
    detected from the name and tags of the current branch. Note: Must pass `space`
    or `branch` if repo is in detached HEAD mode, e.g. when running on Travis.
    """
    # Detect space
    repo = git.Repo('.')
    branch = branch or _detect_branch(repo)
    space = space or _detect_space(repo, branch, yes)
    if space is None:
        return

    # Build static assets
    # These must be built prior to deploying due to the collectstatic
    # functionality of the Python buildpack conflicting with our setup.
    ctx.run('npm run build', echo=True)
    ctx.run(
        'DJANGO_SETTINGS_MODULE=fec.settings.production python fec/manage.py collectstatic --noinput -v 0',
        echo=True
    )
    ctx.run(
        'DJANGO_SETTINGS_MODULE=fec.settings.production python fec/manage.py compress -v 0',
        echo=True
    )

    # Set api
    api = 'https://api.fr.cloud.gov'
    ctx.run('cf api {0}'.format(api), echo=True)

    # Log in if necessary
    if login == 'True':
        ctx.run('cf auth "$FEC_CF_USERNAME_{0}" "$FEC_CF_PASSWORD_{0}"'.format(space.upper()), echo=True)

    # Target space
    ctx.run('cf target -o fec-beta-fec -s {0}'.format(space), echo=True)

    # Set deploy variables
    with open('.cfmeta', 'w') as fp:
        json.dump({'user': os.getenv('USER'), 'branch': branch}, fp)

    # Deploy cms
    deployed = run('cf app cms', echo=True, warn=True)
    cmd = 'zero-downtime-push' if deployed.ok else 'push'
    ctx.run('cf {0} cms -f manifest_{1}.yml'.format(cmd, space), echo=True)


@task
def notify(ctx):
    try:
        meta = json.load(open('.cfmeta'))
    except OSError:
        meta = {}
    slack = Slacker(env.get_credential('FEC_SLACK_TOKEN'))
    slack.chat.post_message(
        env.get_credential('FEC_SLACK_CHANNEL', '#fec'),
        'deploying branch {branch} of app {name} to space {space} by {user}'.format(
            name=env.name,
            space=env.space,
            user=meta.get('user'),
            branch=meta.get('branch'),
        ),
        username=env.get_credential('FEC_SLACK_BOT', 'fec-bot'),
    )
