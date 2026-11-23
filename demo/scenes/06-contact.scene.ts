import { scene } from 'video-demo/scene';

scene(
  'contact',
  {
    title: 'Contact',
    blurb: 'Kontak dan media sosial.',
  },
  async ({ actor, page, shot }) => {
    const section = page.locator('#contact');
    await section.scrollIntoViewIfNeeded();
    await actor.beat(700);

    const heading = section.getByRole('heading', { name: /LET'S CONNECT/i }).first();
    await actor.spotlight(
      heading,
      'Di bagian kontak, pengunjung bisa langsung terhubung untuk kolaborasi atau ide menarik.',
      { scale: 1.3, stay: true }
    );
    await shot('contact-heading');

    const cards = section.locator('a[href]').first();
    await actor.spotlight(
      cards,
      'Tersedia tautan ke TikTok, Instagram, dan saluran WhatsApp untuk tetap terhubung.',
      { scale: 1.25, stay: true }
    );
    await shot('contact-links');
    await actor.unfocus();
    await actor.beat(300);
  }
);
