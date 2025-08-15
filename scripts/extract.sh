#!/bin/bash

LANGS=("en" "de" "fr" "es" "it","ru");


for CODE in "${LANGS[@]}"
do
  mkdir -p ~/rangers-card-data/i18n/$CODE/
  cp functions/assets/i18n/$CODE.po ~/rangers-card-data/i18n/$CODE/functions.po
done
