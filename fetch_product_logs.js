const { CloudWatchLogsClient, FilterLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');
const fs = require('fs');

async function run() {
    const client = new CloudWatchLogsClient({ region: 'ap-southeast-1' });
    const command = new FilterLogEventsCommand({
        logGroupName: '/ecs/budol-shap',
        limit: 100,
        filterPattern: '{ $.message = "*product*" }',
        startTime: Date.now() - 30 * 60 * 1000 // Last 30 minutes
    });

    try {
        const data = await client.send(command);
        const logMessages = data.events.map(e => e.message);
        fs.writeFileSync('product_logs.json', JSON.stringify(logMessages, null, 2), 'utf8');
        console.log('Product logs fetched successfully');
    } catch (err) {
        console.error(err);
    }
}
run();
