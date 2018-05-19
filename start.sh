#!/bin/bash
SCRIPT=$(readlink -f "$0")
PWD=$(dirname "$SCRIPT")
docker-compose -f $PWD/docker-compose.prod.yml up
