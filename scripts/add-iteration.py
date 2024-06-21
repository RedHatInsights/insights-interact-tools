import jira
from os import environ
from datetime import datetime
import argparse
import re

DEFAULT_TOKEN = environ.get("JIRA_TOKEN")
DEFAULT_SERVER = "https://issues.redhat.com"

DATE_FORMAT = "%Y-%m-%d"

parser = argparse.ArgumentParser(
    description="JIRA automation to add corresponding iteration"
)
parser.add_argument(
    "-d",
    "--dry-run",
    default=False,
    action="store_true",
    help="Do not call write APIs, just print output",
)
parser.add_argument(
    "-s",
    "--server",
    default=DEFAULT_SERVER,
    action="store",
    help="JIRA server, defaults to https://issues.redhat.com",
)
parser.add_argument(
    "-t",
    "--token",
    default=DEFAULT_TOKEN,
    action="store",
    help="JIRA auth token, defaults to ENV variable JIRA_TOKEN",
)
args = parser.parse_args()

# --------------- #


def find_iteration(iterations, date):
    for version in iterations:
        try:
            start_date = version.raw["startDate"]
            end_date = version.raw["releaseDate"]
            start_date_d = datetime.strptime(start_date, DATE_FORMAT)
            end_date_d = datetime.strptime(end_date, DATE_FORMAT)
            if start_date_d <= date <= end_date_d:
                return version
        except KeyError:
            continue


def add_fix_version(issues, iteration, status):
    if issues:
        for issue in issues:
            print("{} - {}".format(issue, issue.fields.summary))
            if not args.dry_run:
                issue.add_field_value(
                    field="fixVersions", value={"id": iteration.raw["id"]}
                )
                conn.add_comment(
                    issue,
                    "Issue linked with {} as it transitioned to {}".format(
                        re.sub("\[.*", "", iteration.raw["name"]), status
                    ),
                )
    else:
        print("No {} issues to update".format(status))


conn = jira.JIRA({"server": args.server}, token_auth=args.token)

version_list = conn.project_versions("RHINENG")
iterations_list = list(
    filter(lambda x: (re.search("Iteration \d+ \[.*\]", x.raw["name"])), version_list)
)

matched_iteration = find_iteration(iterations_list, datetime.today())
if matched_iteration is not None:
    jql_progress = (
        "project in (RHINENG) AND "
        "status changed to 'In Progress' AFTER startOfDay() AND "
        "(fixVersion not in ({}) OR fixVersion is EMPTY)".format(
            matched_iteration.raw["id"]
        )
    )
    in_progress_issues = conn.search_issues(jql_progress)
    add_fix_version(in_progress_issues, matched_iteration, "In Progress")

    jql_closed = (
        "project in (RHINENG) AND "
        "status changed to 'Closed' AFTER startOfDay() AND "
        "(fixVersion not in ({}) OR fixVersion is EMPTY)".format(
            matched_iteration.raw["id"]
        )
    )
    closed_issues = conn.search_issues(jql_closed)
    add_fix_version(closed_issues, matched_iteration, "Closed")
else:
    print("No corresponding iteration found for the given date")
