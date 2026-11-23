import { scene } from 'video-demo/scene';

scene(
  'photo-album',
  {
    title: 'Photo Album',
    blurb: 'Galeri foto personal.',
  },
  async ({ actor, page, shot }) => {
    const section = page.locator('#photo-album');
    await section.scrollIntoViewIfNeeded();
    await actor.beat(700);

    const title = section.getByRole('heading', { name: /Momen di balik layar/i }).first();
    await actor.spotlight(
      title,
      'Ada juga Photo Album yang menampilkan momen personal di balik layar dalam galeri interaktif.',
      { scale: 1.3, stay: true }
    );
    await shot('album-title');

    // Click next to show interaction
    const next = section.getByRole('button', { name: 'Foto berikutnya' }).first();
    if (await next.isVisible().catch(() => false)) {
      await actor.click(next);
      await actor.beat(700);
      await actor.say('Galeri ini bisa dijelajahi dengan navigasi yang halus dan responsif.');
      await shot('album-next');
    }

    await actor.unfocus();
    await actor.beat(300);
  }
);
