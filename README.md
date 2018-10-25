# Splatoon 2 Match Reminder 

## Description
Twilio Bot that receives commands and sends texts showing match information for Splatoon 2 (currently only Clam Blitz) and shows the current schedule, the next match, and runs a cron job every hour using `node-cron` to notify the user when a Clam Blitz ranked match is starting. Built using Node.js and Express, containerized with Docker, and deployed with `now.sh`.

## To-do
* Build NoSQL DB to handle subscribers for cron job
* Fix schedule list formatting
* Extend functionality for all match types
