#!/bin/bash

n=0
until [ $n -ge 2 ]
do

   curl -m 5 http://localhost && break  # substitute your command here
   n=$[$n+1]
   sleep 15
done