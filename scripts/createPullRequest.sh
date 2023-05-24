#!/bin/bash

working_dir=$1
title=$2
body=$3

#TODO: local repos might have different remote names, get remote name dynamically
main_branch=$(git remote show upstream | grep "HEAD branch" | sed \'s/.*: //\')

echo "Creating a Pull request in ${working_dir}"
cd $working_dir

has_git_change=$(git diff --numstat |  wc -c)

if [ $has_git_change == 0 ]; then
    echo "Nothing to commit, Probably all of your packages are already aligned" 
    exit 2
fi

git add .

git commit -m "deps: align shared packages to chrome version" -n

if [ $? -ne 0 ]; then
    echo "Commiting new changes has failed" 
    exit 3
fi

#TODO: local repos might have different remote names, get remote name dynamically
git push -u origin HEAD

if [ $? -ne 0 ]; then
    echo "Pushing the new changes to remote has failed" 
    exit 4
fi

#TODO: handle repos without gh configured
pr_url=$(gh pr create -B "$main_branch" -t "$title"  -b "$body")

echo $pr_url
if [ $? -ne 0 ]; then
    if [[ $error_message == *"no pre-defined default repository"* ]]; then
    echo "Error: No default repository set."
    else
    exit 5
    fi
fi

exit 0

