var PProgress = require('p-progress');
var delay = require('delay');


function task() {
    return new Promise((resolve, reject) => {
        delay(1000).then(() => {
            console.log(`Task is completed`);
            resolve();
        })
    })
}

(async () => {
    console.log('Concurency = 1');
    await PProgress.all([task, task, task, task, task], {concurrency: 1});
    console.log('Done');

    console.log('Concurency = 2');
    await PProgress.all([task, task, task, task, task], {concurrency: 2});
    console.log('Done');
})()