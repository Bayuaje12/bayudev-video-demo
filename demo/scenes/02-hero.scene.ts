import { scene } from 'video-demo/scene';

scene(
  'hero',
  {
    title: 'Hero',
    blurb: 'Tampilan utama dan identitas developer.',
  },
  async ({ actor, page, shot }) => {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }));
    await actor.beat(500);

    const tagline = page.locator('#home').getByText('Developer', { exact: false }).first();
    await actor.spotlight(
      tagline,
      'Di bagian utama, Bayu memperkenalkan dirinya sebagai developer dan creative technologist.',
      { scale: 1.5, stay: true }
    );
    await shot('tagline');

    const desc = page.locator('#home').getByText('Saya membangun pengalaman', { exact: false }).first();
    await actor.spotlight(
      desc,
      'Ia fokus membangun pengalaman digital melalui coding, teknologi, kreativitas, dan eksplorasi ide baru.',
      { scale: 1.4, stay: true }
    );
    await shot('description');
    await actor.unfocus();
    await actor.beat(300);
  }
);
