import { scene } from 'video-demo/scene';

scene(
  'closing',
  {
    title: 'Closing',
    blurb: 'Penutup dengan branding BAYUDEV.',
  },
  async ({ actor, page, shot }) => {
    // Scroll to bottom/footer for branding close
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' as ScrollBehavior }));
    await actor.beat(700);

    const footer = page.locator('footer').first();
    await actor.spotlight(
      footer,
      'Terima kasih sudah melihat BAYUDEV titik web titik I D. Mari terhubung dan bangun sesuatu yang bermakna bersama.',
      { scale: 1.4, stay: true }
    );
    await shot('closing');
    await actor.unfocus();
    await actor.beat(500);
  }
);
