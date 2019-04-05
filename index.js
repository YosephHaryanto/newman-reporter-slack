let {
    IncomingWebhook
} = require('@slack/client');
let markdowntable = require('markdown-table');
let prettyms = require('pretty-ms');

const webhook_url = process.env.SLACK_WEBHOOK_URL || '';
const channel = process.env.SLACK_CHANNEL || '';
const header = process.env.HEADER || 'newman run';

const url = process.env.SLACK_WEBHOOK_URL;


class SlackReporter {
    constructor(emitter, reporterOptions, options) {
        const backticks = '```';

        emitter.on('done', (err, summary) => {
            let run = summary.run;
            let data = []
            let headers = [header, 'total', 'failed'];
            let arr = ['iterations', 'requests', 'testScripts', 'prerequestScripts', 'assertions'];

            let title = `${summary.collection.name}:${summary.environment.name}`

            data.push(headers);
            arr.forEach(function (element) {
                data.push([element, run.stats[element].total, run.stats[element].failed]);
            });

            let duration = prettyms(run.timings.completed - run.timings.started);
            data.push(['------------------', '-----', '-------']);
            data.push(['total run duration', duration]);

            let table = markdowntable(data);
            let text = `${title}\n${backticks}${table}${backticks}`

            let msg = {
                channel: channel,
                text: text
            }

            var webhook = new IncomingWebhook(webhook_url);

            if (process.env.http_proxy != null) {
                let HttpsProxyAgent  = require('https-proxy-agent');
                // One of the ways you can configure HttpsProxyAgent is using a simple string.
                // See: https://github.com/TooTallNate/node-https-proxy-agent for more options
                const proxy = new HttpsProxyAgent(process.env.http_proxy);
                var webhook = new IncomingWebhook(webhook_url, { agent: proxy });
            }
             
            webhook.send(msg, (error, response) => {
                if (error) {
                    return console.log(error.message);
                }
                console.log(response);
            });
        });
    }
}

module.exports = SlackReporter;
