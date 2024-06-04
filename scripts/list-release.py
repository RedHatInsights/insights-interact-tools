import jira
from os import environ
from datetime import date
import argparse
import sys

DEFAULT_TOKEN = environ.get('JIRA_TOKEN')
DEFAULT_SERVER = 'https://issues.redhat.com' 
IGNORED_COMPONENTS = ['Frontend', 'Conversions', 'UXD']

parser = argparse.ArgumentParser(description='Interact JIRA Release automation')
parser.add_argument('-d', '--dry-run', default=False, action='store_true', help='Do not call write APIs, just print output')
parser.add_argument('-s', '--server', default=DEFAULT_SERVER, action='store', help='JIRA server, defaults to https://issues.redhat.com')
parser.add_argument('-t', '--token', default=DEFAULT_TOKEN, action='store', help='JIRA auth token, defaults to ENV variable JIRA_TOKEN')
args = parser.parse_args()

conn = jira.JIRA({ 'server': args.server }, token_auth=args.token)

query_result = conn.search_issues('project = RHINENG and Component in (Frontend) and Component not in (QE) and status changed to Closed after startOfDay() and labels not in (interact-internal) and resolution = Done  and status = Closed')
app_releases = dict()
for issue in query_result:
    for component in issue.fields.components:
        if component.name in IGNORED_COMPONENTS:
            continue
        if component.name not in app_releases:
            app_releases[component.name] = []
        app_releases[component.name].append(issue)

today = str(date.today())
for app_name in app_releases:
    release_name = 'Frontend: {} - {}'.format(app_name, today)
    if not args.dry_run:
        new_release = conn.create_version(name=release_name, project='RHINENG', description=app_name)
    print('Created a new release: {}'.format(release_name))
    for issue in app_releases[app_name]:
        if not args.dry_run:
            issue.add_field_value(field='fixVersions', value={'name':release_name})
        print('\t {} - {}'.format(issue.key, issue.fields.summary))
    if not args.dry_run:
        new_release.update(released=True)
    print()
