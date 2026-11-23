# bayudev-video-demo

Automated professional video demo production for [bayudev.web.id](https://bayudev.web.id), powered by a customized [nilbuild/video-demo](https://github.com/nilbuild/video-demo) engine.

## What this repo does

- Records a cinematic vertical (9:16) demo of the live BAYUDEV website
- Uses Playwright + CDP screencast for deterministic capture
- Generates Indonesian voice-over with `edge-tts` (free, no paid API key)
- Renders MP4, poster, screenshots, and manifest via GitHub Actions
- Uploads outputs as workflow artifacts

## Target

- Website: https://bayudev.web.id
- Format: MP4, 1080x1920 (9:16), 30/60 FPS capture target (engine adaptive)
- Voice-over: Indonesian (`id-ID-ArdiNeural`) via `edge-tts`

## Scenes

1. Opening - BAYUDEV branding
2. Hero - Developer & Creative Technologist intro
3. About - Profile and values
4. Skills - Tech stack and capabilities
5. Photo Album - Interactive gallery
6. Contact - Social/contact links
7. Closing - Branding footer

## Run in GitHub Actions

1. Open the **Actions** tab
2. Select **Video Demo - BAYUDEV.WEB.ID**
3. Click **Run workflow**

The workflow installs dependencies, records the site, generates voice-over, renders MP4, and uploads artifacts.

## Local run (Linux/macOS)

```bash
npm install
mkdir -p node_modules && ln -sfn .. node_modules/video-demo
npx playwright install --with-deps chromium
python3 -m pip install edge-tts

export DEMO_PROJECT="$PWD/demo"
export DEMO_CONFIG="$PWD/demo/demo.config.ts"
export DEMO_APP_ROOT="$PWD"
export DEMO_OUT="$PWD/demo/demo-out"
export DEMO_TTS_ENGINE=edge-tts
export DEMO_TTS_VOICE=id-ID-ArdiNeural

node engine/run.mjs
```

## Outputs

After a successful run, check `demo/demo-out/` (or workflow artifacts):

- `manifest.json`
- `index.html` (preview)
- `dark/*.mp4` (scene clips)
- `dark/full-tour.mp4` (stitched tour, if enabled)
- `dark/*.poster.jpg`
- `dark/*.png` (screenshots)

## Notes

- This project records the live public website; it does not modify the production site.
- Narration is based on content visible on bayudev.web.id.
- If voice-over generation fails, set `DEMO_VOICE=0` to render silent video for diagnosis.

## License

Engine base derived from [nilbuild/video-demo](https://github.com/nilbuild/video-demo) (MIT). See `LICENSE`.
