#!/bin/bash

printf "%'6d" `awk -F',' '{print $1}' roseanne_edges_07-06.csv| sort -u|wc -l | perl -pe 'chomp'`
echo " unique edge sources in gephi"

printf "%'6d" `awk -F',' '{print $2}' roseanne_edges_07-06.csv| sort -u|wc -l | perl -pe 'chomp'`
echo " unique edge targets in gephi"

printf "%'6d" `awk -F\t '{print $4}' Copy\ of\ Roseanne\ Coding\ -\ A-J.tsv| wc -l | perl -pe 'chomp'`
echo " unique sources (Users) in coding spreadsheet"
echo

printf "%'6d" `awk -F\t '{print $4}' Copy\ of\ Roseanne\ Coding\ -\ A-J.tsv|grep -i realDonaldTrump | wc -l | perl -pe 'chomp'`
echo " occurrences of realDonaldTrump as User/sender in spreadsheet"

printf "%'6d" `awk -F, '{print $1}' roseanne_edges_07-06.csv| grep -i realDonaldTrump | wc -l | perl -pe 'chomp'`
echo " occurrences of @realDonaldTump as source in gephi edges"

printf "%'6d" `awk -F, '{print $2}' roseanne_edges_07-06.csv| grep -i realDonaldTrump | wc -l | perl -pe 'chomp'`
echo " occurrences of @realDonaldTump as target in gephi edges"

printf "%'6d" `awk -F\t '{print $4}' Copy\ of\ Roseanne\ Coding\ -\ A-J.tsv|egrep '\bAP\b' | wc -l | perl -pe 'chomp'`
echo " occurrences of AP as User/sender in spreadsheet"

printf "%'6d" `awk -F, '{print $1}' roseanne_edges_07-06.csv| egrep -i '\bAP\b' | wc -l | perl -pe 'chomp'`
echo " occurrences of @AP as source in gephi edges"

printf "%'6d" `awk -F, '{print $2}' roseanne_edges_07-06.csv| egrep -i '\bAP\b' | wc -l | perl -pe 'chomp'`
echo " occurrences of @AP as target in gephi edges"

