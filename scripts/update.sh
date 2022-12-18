#!/bin/bash

LANGS=("en" "de" "fr" "it");


for CODE in "${LANGS[@]}"
do
  mkdir -p ~/rangers-card-data/i18n/$CODE/

  cp ~/rangers-card-data/i18n/$CODE/frontend.po frontend/i18n/$CODE.po
  cp ~/rangers-card-data/i18n/$CODE/functions.po functions/assets/i18n/$CODE.po
done
