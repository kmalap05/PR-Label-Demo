# .github/labeler.py
import os
import json
import yaml
from github import Github

def get_changed_files(token, pr_number):
    g = Github(token)
    repo = g.get_repo(os.environ['GITHUB_REPOSITORY'])
    pr = repo.get_pull(pr_number)
    files = [file.filename for file in pr.get_files()]
    return files

def apply_labels(token, pr_number, file_extensions, exclusions):
    g = Github(token)
    repo = g.get_repo(os.environ['GITHUB_REPOSITORY'])
    pr = repo.get_pull(pr_number)

    labels = set()

    # Apply labels based on file extensions
    for file in get_changed_files(token, pr_number):
        extension = file.split('.')[-1]
        if extension in file_extensions:
            labels.add(extension)

    # Exclude labels based on configuration
    for exclusion in exclusions:
        if exclusion['type'] == 'directory' and exclusion['path'] in labels:
            labels.remove(exclusion['path'])
        elif exclusion['type'] == 'file' and exclusion['path'] in labels:
            labels.remove(exclusion['path'])

    # Apply labels to the PR
    pr.add_to_labels(*labels)

if __name__ == "__main__":
    token = os.environ['MY_GITHUB_TOKEN']
    
    # Extract the pull request number from the event payload
    with open(os.environ['GITHUB_EVENT_PATH'], 'r') as event_file:
        event_payload = json.load(event_file)
        pr_number = event_payload['pull_request']['number']

    with open('.github/labeler-config.yml', 'r') as config_file:
        config = yaml.safe_load(config_file)

    apply_labels(token, pr_number, config['fileExtensions'], config['exclusions'])
