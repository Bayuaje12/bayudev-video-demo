import { scene } from 'video-demo/scene';

scene(
  'opening',
  {
    title: 'Opening',
    blurb: 'Pembukaan video demo BAYUDEV.WEB.ID.',
  },
  async ({ actor, page, shot }) => {
    // Ensure we are at top
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }));
    await actor.beat(600);
    await shot('start');

    const heroTitle = page.locator('#home h1').first();
    await actor.spotlight(
      heroTitle,
      'Ini adalah BAYUDEV titik web titik I D, portofolio digital dari Bayu, seorang developer dan creative technologist.',
      { scale: 1.25, stay: true }
    );
    await shot('hero-title');
    await actor.unfocus();
    await actor.beat(400);
  }
);
