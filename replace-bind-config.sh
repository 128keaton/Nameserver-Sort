#!/usr/bin/env bash

FILE=./named.conf.options
if test -f "$FILE"; then
  # Copy configuration
  cp $FILE /etc/bind/named.conf.options

  # Restart bind9
  systemctl restart bind9.service
fi


