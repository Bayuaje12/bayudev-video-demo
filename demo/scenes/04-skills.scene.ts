import { scene } from 'video-demo/scene';

scene(
  'skills',
  {
    title: 'Skills & Tech Stack',
    blurb: 'Keahlian dan teknologi yang digunakan.',
  },
  async ({ actor, page, shot }) => {
    const section = page.locator('#tech-stack');
    await section.scrollIntoViewIfNeeded();
    await actor.beat(700);

    const title = section.getByRole('heading', { name: /Teknologi yang saya jelajahi/i }).first();
    await actor.spotlight(
      title,
      'Bagian Tech Stack menampilkan teknologi yang dipelajari dan digunakan Bayu untuk membangun pengalaman digital.',
      { scale: 1.3, stay: true }
    );
    await shot('skills-title');

    // Click through a couple of tabs to show interactivity
    const backendTab = section.getByRole('button', { name: 'Backend Development' }).first();
    await actor.click(backendTab);
    await actor.beat(500);
    await actor.say('Mulai dari frontend, backend, hingga tools pengembangan, semuanya tersusun rapi.');
    await shot('skills-backend');

    const aiTab = section.getByRole('button', { name: 'AI & Automation' }).first();
    await actor.click(aiTab);
    await actor.beat(500);
    await actor.say('Ada juga fokus pada AI, otomasi, dan integrasi API untuk solusi yang lebih cerdas.');
    await shot('skills-ai');

    await actor.unfocus();
    await actor.beat(300);
  }
);
