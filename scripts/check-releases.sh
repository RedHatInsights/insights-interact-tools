#!/bin/bash

# Add your github token here or export it as env variable
# GITHUB_TOKEN=""
# Same for GitLab's API url - app's interface repository with all apps
# GITLAB_API_URL=""

# Cfg
GH_API_URL="https://api.github.com/repos/RedHatInsights"
GH_URL="https://github.com/RedHatInsights"
GL_PROD_NAMESPACE_LOCATOR="namespaces/prod-frontends.yml"
HASH_REGEX="\b[a-f0-9]{40}\b"
APPS_TO_BE_RELEASED_COUNT=0
SHOW_ALL_APPS=0
VERBOSE=0

# Paths to Apps' details
declare -A apps
apps["Advisor RHEL,GH"]="insights-advisor-frontend"
apps["Advisor RHEL,GL"]="advisor%2Fdeploy.yml"
apps["Advisor RHEL,dpl_name"]="advisor-frontend"

apps["Compliance,GH"]="compliance-frontend"
apps["Compliance,GL"]="compliance%2Fdeploy.yml"
apps["Compliance,dpl_name"]="compliance-frontend"

apps["Dashboard,GH"]="insights-dashboard"
apps["Dashboard,GL"]="frontend-base%2Fdeploy.yml"
apps["Dashboard,dpl_name"]="insights-dashboard"

apps["Inventory,GH"]="insights-inventory-frontend"
apps["Inventory,GL"]="host-inventory%2Fdeploy-clowder.yml"
apps["Inventory,dpl_name"]="host-inventory-frontend"

apps["Malware,GH"]="malware-detection-frontend"
apps["Malware,GL"]="malware-detection%2Fdeploy.yml"
apps["Malware,dpl_name"]="malware-detection-frontend"

apps["Advisor OCP,GH"]="ocp-advisor-frontend"
apps["Advisor OCP,GL"]="ccx-data-pipeline%2Fdeploy.yml"
apps["Advisor OCP,dpl_name"]="ocp-advisor-frontend"

apps["Patchman,GH"]="patchman-ui"
apps["Patchman,GL"]="patchman%2Fdeploy-clowder.yml"
apps["Patchman,dpl_name"]="patchman-ui"

apps["Policies,GH"]="policies-ui-frontend"
apps["Policies,GL"]="policies%2Fdeploy-clowder.yml"
apps["Policies,dpl_name"]="policies-ui-frontend"

apps["Registration assistant,GH"]="registration-assistant"
apps["Registration assistant,GL"]="frontend-base%2Fdeploy.yml"
apps["Registration assistant,dpl_name"]="registration-assistant"

apps["Remediations,GH"]="insights-remediations-frontend"
apps["Remediations,GL"]="remediations%2Fdeploy-clowder.yml"
apps["Remediations,dpl_name"]="remediations-frontend"

apps["Sed,GH"]="sed-frontend"
apps["Sed,GL"]="config-manager%2Fdeploy.yml"
apps["Sed,dpl_name"]="sed-frontend"

apps["Sed,GH"]="sed-frontend"
apps["Sed,GL"]="config-manager%2Fdeploy.yml"
apps["Sed,dpl_name"]="sed-frontend"

apps["Tasks,GH"]="tasks-frontend"
apps["Tasks,GL"]="advisor%2Fdeploy.yml"
apps["Tasks,dpl_name"]="tasks-frontend"

apps["Vulnerability OCP,GH"]="vuln4shift-frontend"
apps["Vulnerability OCP,GL"]="ocp-vulnerability%2Fdeploy.yml"
apps["Vulnerability OCP,dpl_name"]="vuln4shift-frontend"

apps["Vulnerability RHEL,GH"]="vulnerability-ui"
apps["Vulnerability RHEL,GL"]="vulnerability%2Fdeploy-clowder.yml"
apps["Vulnerability RHEL,dpl_name"]="vulnerability-ui"

print_help(){
	echo "Usage: ./check-releases [options]"
	echo ""
	echo "Options:"
	echo "  -a, --all	Display all apps, even those with 0 commits to be released."
	echo "  -v, --verbose	Display detailed information."
	echo "  -h, --help	Display this message."
	echo ""
}

print_result_header(){
	local app_name=$1
	local i=$2
	local app_commits_page_url=$3

	printf "\e]8;;%s\e\\%-${longest_app_name_length}s\e]8;;\e\\" $app_commits_page_url "$app_name"
	echo ": $i commits to be released"
}

print_result_details(){
	local app_name=$1
	local i=$2
	local -a app_commit_history=("${@:3}")

	# Display the last commit released
	last_commit_gh_url=$GH_URL/${apps[$app_name,'GH']}/commit/${app_commit_history[$i]}
	last_commit_hash=${app_commit_history[$i]}
	echo
	printf -- "	- Last released commit: \e]8;;%s\e\\%s\e]8;;\e\\" "$last_commit_gh_url" "$last_commit_hash"
	echo

	# Display all commits waiting to be released
	echo "	- Commits to be released: "
	for ((j=0; j<$i; j++)); do
		commit_gh_url=$GH_URL/${apps[$app_name,'GH']}/commit/${app_commit_history[j]}
		commit_hash=${app_commit_history[j]}
		printf "		- \e]8;;%s\e\\%s\e]8;;\e\\" "$commit_gh_url" "$commit_hash"
		echo
	done
	echo
}

print_summary(){
	if [[ $APPS_TO_BE_RELEASED_COUNT > 0 ]]; then
		echo
		echo "$APPS_TO_BE_RELEASED_COUNT apps to be released"
	else
		echo "No apps to be released"
	fi
}

get_longest_app_name_length(){
	length=0
	for app in "${!apps[@]}"; do
		IFS=',' read -r app_name repo <<< "$app"
		if [[ ${#app_name} -gt $length ]]; then
			length=${#app_name}
		fi
	done
	echo $length
}

get_commit_history(){
	local $app_name=$1

	app_gh_api_url="$GH_API_URL/${apps[$app_name,"GH"]}/commits"
	app_commit_history_response=$(
		curl -s -H "Authorization: token $GITHUB_TOKEN" -H "Accept: application/vnd.github.v3+json" $app_gh_api_url
	)
	# if [[ "$app_commit_history_response" == *"Bad credentials"* && "$app_commit_history_response" == *'"status": "401"'* ]]; then
	# 	echo "Set GITHUB_TOKEN"
	# 	exit 0
	# fi
	app_commit_history_string=$(
		echo $app_commit_history_response | jq -r '.[] | .sha'
	)
	echo "$app_commit_history_string"
}

get_released_commit(){
	local $app_name=$1

	app_gl_url="$GITLAB_API_URL%2F${apps[$app_name,"GL"]}/raw"
	app_released_commit=$(curl -s $app_gl_url | grep -A 100 "name: ${apps[$app_name,"dpl_name"]}" | grep -A 5 $GL_PROD_NAMESPACE_LOCATOR | grep -oE $HASH_REGEX | head -n 1)
	echo "$app_released_commit"
}



# Parameters handler
while getopts "vah-:" opt; do
	case $opt in
		a)
			let "SHOW_ALL_APPS=1"
			;;
		v)
			let "VERBOSE=1"
			;;
		h)
			print_help
			exit 0
			;;
		-)
			case "${OPTARG}" in
				all)
					let "SHOW_ALL_APPS=1"
					;;
				verbose)
					let "VERBOSE=1"
					;;
				help)
					print_help
					exit 0
					;;
				*)
					# ignore
					;;
			esac
			;;
		\?)
			# ignore
			;;
	esac
done

# Get length of the longest app name for nice printing
longest_app_name_length=$(get_longest_app_name_length)

# MAIN
for app in "${!apps[@]}"; do
	IFS=',' read -r app_name repo <<< "$app"
	if [[ "$repo" == "GL" ]]; then

		# Get app's last commit deployed in app-interface
		app_released_commit=$(get_released_commit "$app_name")
		# Get app's commit history
		app_commit_history=($(get_commit_history "$app_name"))
		# Create link to the app's commits list page
		app_commits_page_url="$GH_URL/${apps[$app_name,"GH"]}/commits/master"

		# Check if there are any commits to be deployed
		for ((i=0; i<${#app_commit_history[@]}; i++)); do

			# If last released hash was found in commit history
			if [[ "$app_released_commit" == "${app_commit_history[i]}" ]]; then
				# If match is on the last commit - everyting is released
				if [[ $i == 0 ]]; then
					if [[ $SHOW_ALL_APPS == 1 ]]; then
						print_result_header "$app_name" $i $app_commits_page_url
					fi

				# If there are commits to be released
				else
					print_result_header "$app_name" $i $app_commits_page_url
					let "APPS_TO_BE_RELEASED_COUNT++"

					# Display extended output with detailed info
					if [[ $VERBOSE == 1 ]]; then
						print_result_details "$app_name" $i "${app_commit_history[@]}"
					fi
				fi
				break
			fi
			
			# If last released hash wasn't found in commit history
			if [[ $i == $(( ${#app_commit_history[@]} - 1 )) ]]; then
				print_result_header "$app_name" "$i+" "$app_commits_page_url"
				let "APPS_TO_BE_RELEASED_COUNT++"
			fi

		done

	fi
done

# Printing out number of apps to be released
print_summary