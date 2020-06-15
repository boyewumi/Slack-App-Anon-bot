#!/bin/bash

deploymentID=$(aws deploy create-deployment \
  --application-name anon-ask \
  --deployment-config-name CodeDeployDefault.AllAtOnce \
  --deployment-group-name prod \
  --github-location repository=stewartthomson/anon-ask,commitId=$(git rev-parse origin/master) \
  --output text)

###
# Following code is adapted from https://github.com/quartethealth/aws-code-deploy
###

h1() {
  printf "\n${bold}${underline}%s${reset}\n" "$(echo "$@" | sed '/./,$!d')"
}
h2() {
  printf "\n${bold}%s${reset}\n" "$(echo "$@" | sed '/./,$!d')"
}
info() {
  printf "${dim}➜ %s${reset}\n" "$(echo "$@" | sed '/./,$!d')"
}
success() {
  printf "${green}✔ %s${reset}\n" "$(echo "$@" | sed '/./,$!d')"
}
error() {
  printf "${red}${bold}✖ %s${reset}\n" "$(echo "$@" | sed '/./,$!d')"
}
warnError() {
  printf "${red}✖ %s${reset}\n" "$(echo "$@" | sed '/./,$!d')"
}
warnNotice() {
  printf "${blue}✖ %s${reset}\n" "$(echo "$@" | sed '/./,$!d')"
}
note() {
  printf "\n${bold}${blue}Note:${reset} ${blue}%s${reset}\n" "$(echo "$@" | sed '/./,$!d')"
}
jsonValue() {
  key=$1
  num=$2
  awk -F"[,:}]" '{for(i=1;i<=NF;i++){if($i~/'$key'\042/){print $(i+1)}}}' | tr -d '"' | sed -n ${num}p
}

h1 "Deployment Overview"

DEPLOYMENT_GET="aws deploy get-deployment --deployment-id \"$deploymentID\""
h2 "Monitoring deployment \"$deploymentID\" for..."
info "$DEPLOYMENT_GET"
printf "\n"

while :; do
  DEPLOYMENT_GET_OUTPUT="$(eval $DEPLOYMENT_GET 2>&1)"
  if [ $? != 0 ]; then
    warnError "$DEPLOYMENT_GET_OUTPUT"
    error "Deployment of application failed"
    exit 1
  fi

  # Deployment Overview
  IN_PROGRESS=$(echo "$DEPLOYMENT_GET_OUTPUT" | jsonValue "InProgress" | tr -d "\r\n ")
  PENDING=$(echo "$DEPLOYMENT_GET_OUTPUT" | jsonValue "Pending" | tr -d "\r\n ")
  SKIPPED=$(echo "$DEPLOYMENT_GET_OUTPUT" | jsonValue "Skipped" | tr -d "\r\n ")
  SUCCEEDED=$(echo "$DEPLOYMENT_GET_OUTPUT" | jsonValue "Succeeded" | tr -d "\r\n ")
  FAILED=$(echo "$DEPLOYMENT_GET_OUTPUT" | jsonValue "Failed" | tr -d "\r\n ")

  if [ "$IN_PROGRESS" == "" ]; then IN_PROGRESS="-"; fi
  if [ "$PENDING" == "" ]; then PENDING="-"; fi
  if [ "$SKIPPED" == "" ]; then SKIPPED="-"; fi
  if [ "$SUCCEEDED" == "" ]; then SUCCEEDED="-"; fi
  if [ "$FAILED" == "" ]; then FAILED="-"; fi

  # Deployment Status
  STATUS=$(echo "$DEPLOYMENT_GET_OUTPUT" | jsonValue "status" | tr -d "\r\n" | tr -d " ")
  ERROR_MESSAGE=$(echo "$DEPLOYMENT_GET_OUTPUT" | jsonValue "message")

  printf "\r${bold}${blink}Status${reset}  | In Progress: $IN_PROGRESS  | Pending: $PENDING  | Skipped: $SKIPPED  | Succeeded: $SUCCEEDED  | Failed: $FAILED  | "

  # Print Failed Details
  if [ "$STATUS" == "Failed" ]; then
    printf "\r${bold}Status${reset}  | In Progress: $IN_PROGRESS  | Pending: $PENDING  | Skipped: $SKIPPED  | Succeeded: $SUCCEEDED  | Failed: $FAILED  |\n"
    error "Deployment failed: $ERROR_MESSAGE"

    # Retrieve failed instances. Use text output here to easier retrieve array. Output format:
    # INSTANCESLIST   i-1497a9e2
    # INSTANCESLIST   i-23a541eb
    LIST_INSTANCES_OUTPUT=""
    h2 "Retrieving failed instance details ..."
    runCommand "aws deploy list-deployment-instances --deployment-id $deploymentID --instance-status-filter Failed --output text" \
      "" \
      "" \
      LIST_INSTANCES_OUTPUT

    INSTANCE_IDS=($(echo "$LIST_INSTANCES_OUTPUT" | sed -r 's/INSTANCESLIST\s+//g'))
    INSTANCE_IDS_JOINED=$(printf ", %s" "${INSTANCE_IDS[@]}")
    success "Found ${#INSTANCE_IDS[@]} failed instance(s) [ ${INSTANCE_IDS_JOINED:2} ]"

    # Enumerate over each failed instance
    for i in "${!INSTANCE_IDS[@]}"; do
      FAILED_INSTANCE_OUTPUT=$(aws deploy get-deployment-instance --deployment-id $deploymentID --instance-id ${INSTANCE_IDS[$i]} --output text)
      printf "\n${bold}Instance: ${INSTANCE_IDS[$i]}${reset}\n"

      echo "$FAILED_INSTANCE_OUTPUT" | while read -r line; do

        case "$(echo $line | awk '{ print $1; }')" in

        INSTANCESUMMARY)

          printf "    Instance ID:  %s\n" "$(echo $line | awk '{ print $3; }')"
          printf "         Status:  %s\n" "$(echo $line | awk '{ print $5; }')"
          printf "Last Updated At:  %s\n\n" "$(date -d @$(echo $line | awk '{ print $4; }'))"
          ;;

        # The text version should have either 3 or 5 arguments
        # LIFECYCLEEVENTS            ValidateService         Skipped
        # LIFECYCLEEVENTS    1434231363.6    BeforeInstall   1434231363.49   Failed
        # LIFECYCLEEVENTS    1434231361.79   DownloadBundle  1434231361.34   Succeeded
        LIFECYCLEEVENTS)
          # For now, lets just strip off start/stop times. Also convert tabs to spaces
          lineModified=$(echo "$line" | sed -r 's/[0-9]+\.[0-9]+//g' | sed 's/\t/    /g')

          # Bugfix: Ubuntu 12.04 has some weird issues with spacing as seen on CircleCI. We fix this
          # by just condensing down to single spaces and ensuring the proper separator.
          IFS=$' '
          ARGS=($(echo "$lineModified" | sed -r 's/\s+/ /g'))

          if [ ${#ARGS[@]} == 3 ]; then
            case "${ARGS[2]}" in
            Succeeded)
              printf "${bold}${green}✔ [%s]${reset}\t%s\n" "${ARGS[2]}" "${ARGS[1]}"
              ;;

            Skipped)
              printf "${bold}  [%s]${reset}\t%s\n" "${ARGS[2]}" "${ARGS[1]}"
              ;;

            Failed)
              printf "${bold}${red}✖ [%s]${reset}\t%s\n" "${ARGS[2]}" "${ARGS[1]}"
              ;;
            esac

          else
            echo "[UNKNOWN] (${#ARGS[@]}) $lineModified"
          fi
          ;;

        DIAGNOSTICS)
          # Skip diagnostics if we have "DIAGNOSTICS      Success         Succeeded"
          if [ "$(echo $line | awk '{ print $2; }')" == "Success" ] && [ "$(echo $line | awk '{ print $3; }')" == "Succeeded" ]; then
            continue
          fi

          # Just pipe off the DIAGNOSTICS
          printf "${red}%s${reset}\n" "$(echo $line | sed -r 's/^DIAGNOSTICS\s*//g')"
          ;;

        *)
          printf "${red}${line}${reset}\n"
          ;;

        esac

      done # end: while

    done # ~ end: instance

    printf "\n\n"
    exit 1
  fi

  # Deployment succeeded
  if [ "$STATUS" == "Succeeded" ]; then
    printf "\r${bold}Status${reset}  | In Progress: $IN_PROGRESS  | Pending: $PENDING  | Skipped: $SKIPPED  | Succeeded: $SUCCEEDED  | Failed: $FAILED  |\n"
    success "Deployment of application succeeded"
    break
  fi

  sleep 2
done
