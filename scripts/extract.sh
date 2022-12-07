#!/bin/bash

LANGS=("en" "de" "it");


for CODE in "${LANGS[@]}"
do
  mkdir -p ~/rangers-card-data/i18n/$CODE/
  cp frontend/i18n/$CODE.po ~/rangers-card-data/i18n/$CODE/frontend.po
  cp functions/assets/i18n/$CODE.po ~/rangers-card-data/i18n/$CODE/functions.po
done
