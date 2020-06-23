#!/bin/bash

# set env variables from jenkins creds
echo USERNAME $BTP_DEV_USR
docker-compose -f docker-compose.test.yml up -d --build
sleep 2
docker-compose -f docker-compose.test.yml exec -T api npm run test
exitcode=$?
docker-compose -f docker-compose.test.yml stop
docker-compose -f docker-compose.test.yml rm -f
exit $exitcode
