import { scene } from 'video-demo/scene';

scene(
  'about',
  {
    title: 'About',
    blurb: 'Profil singkat Bayu.',
  },
  async ({ actor, page, shot }) => {
    const about = page.locator('#about');
    await about.scrollIntoViewIfNeeded();
    await actor.beat(700);

    const heading = about.getByRole('heading', { name: /Hi, I'm Bayu/i }).first();
    await actor.spotlight(
      heading,
      'Di bagian tentang, Bayu berbagi minatnya pada pengembangan website, teknologi modern, AI agent, dan inovasi digital.',
      { scale: 1.35, stay: true }
    );
    await shot('about-heading');

    const bio = about.getByText('teknologi bukan hanya soal kode', { exact: false }).first();
    await actor.spotlight(
      bio,
      'Baginya, teknologi bukan hanya soal kode, tapi juga menciptakan pengalaman digital yang hidup dan bermakna.',
      { scale: 1.35, stay: true }
    );
    await shot('about-bio');
    await actor.unfocus();
    await actor.beat(300);
  }
);
