import { defineDemo } from 'video-demo/define';

export default defineDemo({
  name: 'BAYUDEV.WEB.ID',
  site: 'https://bayudev.web.id',
  stage: { width: 1080, height: 1920 },
  clock: {
    timezone: 'Asia/Jakarta',
    locale: 'id-ID',
  },
  themes: ['dark'],
  entries: {
    app: {
      path: '/',
      ready: async (page) => {
        // Wait for the intro loader to finish and main content to be visible
        await page.waitForLoadState('domcontentloaded');
        // Intro can take ~4s; wait for it to disappear and hero to be visible
        await page.waitForFunction(() => {
          const intro = document.querySelector('[aria-label="Intro loading"]');
          const home = document.querySelector('#home');
          return !intro && !!home;
        }, undefined, { timeout: 30000 });
        // Give animations a moment to settle
        await page.waitForTimeout(1200);
      },
    },
  },
  voice: {
    name: process.env.DEMO_TTS_VOICE || 'id-ID-ArdiNeural',
    speed: Number(process.env.DEMO_VOICE_SPEED || 1),
  },
  tour: ['opening', 'hero', 'about', 'skills', 'photo-album', 'contact', 'closing'],
});
