import os
import json
import git
import sys
import cfenv

from invoke import run  # noqa F401
from invoke import task
from slacker import Slacker

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
        run = input(  # noqa F811
            'Deploy to space {space} (enter "yes" to deploy)? > '.format(**locals())
        )
        if run.lower() not in ['y', 'yes']:
            return None
    return space


DEPLOY_RULES = (
    ('prod', _detect_prod),
    ('stage', lambda _, branch: branch.startswith('release')),
    # ('dev', lambda _, branch: branch == 'develop'),
    ('dev', lambda _, branch: branch == 'feature/test-update-adr-section'),
    # Uncomment below and adjust branch name to deploy desired feature branch to the feature space
    # ('feature', lambda _, branch: branch == '[BRANCH NAME]'),
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
    ctx.run('npm run build-production', echo=True)
    ctx.run(
        'cd fec && DJANGO_SETTINGS_MODULE=fec.settings.production python manage.py collectstatic --noinput -v 0',
        echo=True,
    )

    if login == 'True':
        # Set api
        api = 'https://api.fr.cloud.gov'
        ctx.run('cf api {0}'.format(api), echo=True)
        # Authenticate
        ctx.run('cf auth "$FEC_CF_USERNAME_{0}" "$FEC_CF_PASSWORD_{0}"'.format(
            space.upper()), echo=True
        )

    # Target space
    ctx.run('cf target -o fec-beta-fec -s {0}'.format(space), echo=True)

    # Set deploy variables
    with open('.cfmeta', 'w') as fp:
        json.dump({'user': os.getenv('USER'), 'branch': branch}, fp)

    # Deploy cms
    existing_deploy = ctx.run('cf app cms', echo=True, warn=True)
    print("\n")
    cmd = 'push --strategy rolling' if existing_deploy.ok else 'push'
    new_deploy = ctx.run(
        'cf {0} cms -f manifest_{1}.yml'.format(cmd, space),
        echo=True,
        warn=True,
    )

    if not new_deploy.ok:
        print("Build failed!")
        # Check if there are active deployments
        app_guid = ctx.run('cf app cms --guid', hide=True, warn=True)
        app_guid_formatted = app_guid.stdout.strip()
        status = ctx.run(
            'cf curl "/v3/deployments?app_guids={}&status_values=ACTIVE"'.format(app_guid_formatted),
            hide=True,
            warn=True,
        )
        active_deployments = json.loads(status.stdout).get("pagination").get("total_results")
        # Try to roll back
        if active_deployments > 0:
            print("Attempting to roll back any deployment in progress...")
            # Show the in-between state
            ctx.run('cf app cms', echo=True, warn=True)
            cancel_deploy = ctx.run('cf cancel-deployment cms', echo=True, warn=True)
            if cancel_deploy.ok:
                print("Successfully cancelled deploy. Check logs.")
            else:
                print("Unable to cancel deploy. Check logs.")

        # Fail the build
        return sys.exit(1)

    # Allow proxy to connect to CMS via internal route
    add_network_policy = ctx.run(
        'cf add-network-policy proxy cms'.format(cmd, space),  # noqa F523
        echo=True,
        warn=True,
    )
    if not add_network_policy.ok:
        print(
            "Unable to add network policy. Make sure the proxy app is deployed.\n"
            "For more information, check logs."
        )

        # Fail the build because the CMS will be down until the proxy can connect
        return sys.exit(1)

    print("\nA new version of your application 'cms' has been successfully pushed!")
    ctx.run('cf apps', echo=True, warn=True)

    # Needed by CircleCI
    return sys.exit(0)


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
