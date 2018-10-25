require('dotenv').config();

const app = require('express')();
const axios = require('axios');
const moment = require('moment-timezone');
const cron = require('node-cron');
const bodyParser = require('body-parser');

const convertEpochToReadable = (epoch) => moment.unix(epoch).tz('America/Los_Angeles').format('MMM DD h:mm A');

const sendMessage = (message, number) => {
    const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    const options = {
        to: number,
        from: process.env.FROM_NUMBER,
        body: message
    };

    client.messages.create(options, (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log('Text sent');
        }
    });
};

const fetchRankedSchedule = async () => {
    const res = await axios.get(process.env.SCHEDULE_URL);
    const rankedSchedules = res.data.modes.gachi;

    return rankedSchedules;
};

const filterForClamBlitz = (schedule) => {
    return schedule.filter((match) => {
        return (match.rule.key === 'clam_blitz') ? true : false;
    });
}

// TODO: Fix formatting
const createMessageForUpcomingSchedule = (schedule) => {
    let messages = schedule.map(({ startTime, endTime, maps }, i) => {
        return `
        Match ${i+1} -
        Start Time - ${convertEpochToReadable(startTime)} PST
        End Time - ${convertEpochToReadable(endTime)} PST
        Stages - ${maps[0]} and ${maps[1]}
        `;
    });

    return messages.join('\n');
}

const getNextMatch = (schedule) => {
    return `The next match starts at ${convertEpochToReadable(schedule[0].startTime)}!`
};

// TODO: Create DB (probably NoSQL) to add subscribers to a list
// then pull them down whenever cron runs and send notifications them to subscribers only
cron.schedule('* 3 * * *', async () => {
    console.log('checking if clam blitz is now...');

    const rankedSchedule = await fetchRankedSchedule();

    const { endTime, rule: { key }} = filterForClamBlitz(rankedSchedule)[0]; 

    if(key === 'clam_blitz') {
        sendMessage(`Clam Blitz is starting right now and runs until ${convertEpochToReadable(endTime)} PST!`, process.env.TO_NUMBER);
    } else {
        console.log(`it's not`);
    }
});

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', async (req, res, next) => {
    res.send('clam blitz service').status(200);
});

app.post('/sms', async (req, res, next) => {
    const { Body: message, From: number } = req.body;

    switch(message.toLowerCase()) {
        case 'cbschedule': {
            const rankedSchedule = await fetchRankedSchedule();
            sendMessage(createMessageForUpcomingSchedule(filterForClamBlitz(rankedSchedule)), number);
            break;
        }
        case 'cbnext': {
            const rankedSchedule = await fetchRankedSchedule();
            sendMessage(getNextMatch(filterForClamBlitz(rankedSchedule)), number);
            break;
        }
        default: {
            sendMessage('Not a valid command', number);
            break;
        }
    }

    console.log(message);
});

app.listen(3000, () => console.log('listening on 3000'));
