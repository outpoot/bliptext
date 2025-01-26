const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const readline = require('readline');
const os = require('os');
const fetch = require('node-fetch');
const convertWikiToMD = require('./wikipedia_to_blip').default;

const MIN_CHAR_LENGTH = 2000;
const WORKER_COUNT = Math.min(os.cpus().length * 4, 32);

// last checkpoint
//const START_FROM_ARTICLE = 900_000 + 481098 + 1534899 + 1116716 + 1205688 + 1001052 + 1161208;
const START_FROM_ARTICLE = 0;

if (isMainThread) {
  const [, , inputPath, sessionToken] = process.argv;
  if (!inputPath || !sessionToken) {
    console.log('Usage: node importer.js <input.jsonl> <session_token>');
    process.exit(1);
  }

  let count = 0;
  let skipped = 0;
  let active = 0;
  const start = Date.now();
  let finished = false;
  let lineNumber = 0;

  // Create worker pool
  const workers = Array.from({ length: WORKER_COUNT }, () => {
    const worker = new Worker(__filename, { workerData: { sessionToken } });

    worker.on('error', (err) => {
      console.error('Worker error:', err);
    });

    worker.on('exit', (code) => {
      if (code !== 0) console.error(`Worker stopped with exit code ${code}`);
    });

    return worker;
  });

  // Progress reporter
  const timer = setInterval(() => {
    const sec = Math.round((Date.now() - start) / 1000);
    const rate = Math.floor(count / sec);
    process.stdout.write(`\r[${sec}s] Processed: ${count} | Skipped: ${skipped} | Rate: ${rate}/s | Active: ${active}`);
  }, 1000);

  // Feed articles to workers
  const feed = readline.createInterface({
    input: fs.createReadStream(inputPath),
    crlfDelay: Infinity
  });

  feed.on('line', (line) => {
    lineNumber++;
    if (lineNumber < START_FROM_ARTICLE) {
      return;
    }
    active++;
    workers[count % WORKER_COUNT].postMessage(line);
  });

  // Handle results
  workers.forEach(worker => {
    worker.on('message', msg => {
      active--;
      if (msg.error) {
        skipped++;
        console.error('\nError:', msg.error);
      } else {
        count++;
        skipped += msg.skipped || 0;
      }
    });
  });

  // Completion handler
  feed.on('close', () => {
    finished = true;
  });

  // Keep alive until done
  const checkDone = setInterval(() => {
    if (finished && active === 0) {
      clearInterval(timer);
      clearInterval(checkDone);
      const sec = Math.round((Date.now() - start) / 1000);
      console.log(`\n\nDone! Processed ${count} articles (${skipped} skipped) in ${sec} seconds`);
      workers.forEach(w => w.terminate());
    }
  }, 1000);

} else {
  // Worker thread
  const { sessionToken } = workerData;
  const httpAgent = new (require('http')).Agent({ keepAlive: true, maxSockets: 25 });
  const httpsAgent = new (require('https')).Agent({ keepAlive: true, maxSockets: 25 });

  parentPort.on('message', async (line) => {
    try {
      const article = JSON.parse(line);

      // Fast rejection
      if (!article.raw_text || article.raw_text.length < MIN_CHAR_LENGTH) {
        return parentPort.postMessage({ skipped: 1 });
      }

      // Convert content
      const content = await convertWikiToMD(article.raw_text);
      if (content.length < MIN_CHAR_LENGTH * 0.7) {
        return parentPort.postMessage({ skipped: 1 });
      }

      // Post request
      await fetch("http://localhost:3000/api/articles", {
        method: 'POST',
        headers: {
          "cookie": `better-auth.session_token=${sessionToken}`,
          "content-type": "text/plain;charset; charset=UTF-8",
        },
        agent: u => u.startsWith('https') ? httpsAgent : httpAgent,
        body: JSON.stringify({
          title: article.title,
          content: content
        }),
        timeout: 5000,
        retry: 3,
      });

      parentPort.postMessage({ success: true });
    } catch (e) {
      parentPort.postMessage({
        error: e.message.slice(0, 200),
        stack: e.stack?.split('\n')[0]
      });
    }
  });
}