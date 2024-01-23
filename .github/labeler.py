import os
import yaml
from github import Github

def analyze_files(pr_files):
    labels = []

    for file_path in pr_files:
        if file_path.endswith('.js'):
            labels.append('javascript')
        elif file_path.endswith('.css'):
            labels.append('css')

    return labels

def main():
    token = os.environ.get('GITHUB_TOKEN')
    pr_number = os.environ.get('GITHUB_EVENT_PATH')

    with open(pr_number, 'r') as file:
        pr_data = yaml.safe_load(file)

    pr_files = [file['filename'] for file in pr_data['pull_request']['files']]
    labels = analyze_files(pr_files)

    if labels:
        github = Github(token)
        repo = github.get_repo(os.environ.get('GITHUB_REPOSITORY'))
        pr = repo.get_pull(int(pr_data['number']))
        pr.add_to_labels(*labels)

if __name__ == "__main__":
    main()
