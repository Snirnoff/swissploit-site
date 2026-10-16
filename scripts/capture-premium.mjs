import fs from 'node:fs/promises';
import { openBrowser, delay } from './seo-browser.mjs';
const phase = process.argv[2] || 'before';
const folder = `.visual-check/premium-v5.1/${phase}`;
await fs.mkdir(folder, { recursive: true });
const browser = await openBrowser(4197, 9357);
const { call, evaluate, origin } = browser;
try {
  for (const [width, height] of [[1440,900],[390,844]]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    for (const [name, route, target] of [
      ['home','/'], ['business','/unternehmen/'], ['dashboard','/unternehmen/','#dashboard'],
      ['games','/quiz-games/'], ['escape','/phishing-simulation/','[data-phish-start]'],
      ['contact','/ueber-swissploit/#kontakt','#kontakt']
    ]) {
      await call('Page.navigate', { url: origin + route });
      await delay(1600);
      if (target) await evaluate(`document.querySelector(${JSON.stringify(target)})?.scrollIntoView({block:'start'})`);
      if (name === 'escape') await evaluate('document.querySelector("[data-phish-start]").click()');
      await delay(350);
      const shot = await call('Page.captureScreenshot', { format: 'png' });
      await fs.writeFile(`${folder}/${name}-${width}.png`, Buffer.from(shot.data, 'base64'));
    }
    console.log(`${phase}: six screenshots at ${width}px`);
  }
  console.log(JSON.stringify({ errors: browser.errors, badResponses: browser.badResponses }));
} finally { browser.close(); }
