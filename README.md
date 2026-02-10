# resonatale-app
ResonaTale — clean rebuild repository
READ me
🎧🎥 ResonaTale — Personal Audio & Video Stories

ResonaTale is a mobile-first web app that lets users generate emotionally personal stories narrated in their own voice — or as a talking photo/video avatar.

Users record once, choose how they want their story delivered, and unlock content using credits. The experience is calm, premium, and deeply personal.

✨ Core Experience

ResonaTale offers two story formats:

🎙 Option 1 — Audio Story (Voice Clone)

User records their voice once

AI generates a story

Story is narrated in the user’s own voice

Costs 1 credit ($4.99) per full story

🖼 Option 2 — Video Story (Talking Avatar)

User uploads a photo (or selfie)

Story is narrated by a talking video avatar

Lip-sync + facial animation

Costs 1.2 credits ($5.99) per full story

Both formats:

Share the same story logic

Share the same credit system

Differ only in output format

🧠 How It Works (End-to-End)

First Visit
Frontend calls GET /user

Backend returns:

credits

hasVoice

hasAvatar

App decides which layer to show

Capture Phase (One-Time)
User chooses one or both:

🎙 Voice Capture

Browser MediaRecorder

Audio sent to /voice/clone

Voice is cloned once and reused

🖼 Avatar Capture

User uploads an image

Image sent to /avatar/create

Avatar ID stored server-side

Story Creation
User enters a prompt

Optional mood / genre / language

App calls /story/generate

User receives a free preview

Unlocking (Conversion)
User chooses how to continue:

Format Cost Endpoint Audio 1 credit /story/unlock/audio Video 1.2 credits /story/unlock/video

Credits are deducted server-side only.

🧱 Architecture Overview Frontend (Cloudflare Pages) │ ├── index.html # Structure (no logic) ├── app.css # Visual states & moods └── app.js # State machine & flow │ Backend (Cloudflare Worker) │ ├── /user ├── /credits/checkout ├── /stripe/webhook ├── /voice/clone ├── /avatar/create ├── /story/generate ├── /story/unlock/audio ├── /story/unlock/video │ AI Providers │ ├── OpenAI → Story text ├── ElevenLabs → Voice narration └── HeyGen → Talking avatar video │ Storage │ ├── KV (user state, credits) ├── R2 (audio & video files) └── Stripe (payments)

🎛 App Layers (SPA)

ResonaTale is a single-page application with explicit layers:

layer-record — voice recording

layer-avatar — image upload

layer-generate — prompt + options

layer-preview — preview playback

layer-settings — mood / genre / language

layer-journal — unlocked stories

Only one layer is active at a time.

💳 Credit System

Credits are the only monetization gate

Stored and enforced server-side

Visual feedback in UI

Pricing

Audio story → 1 credit ($4.99)

Video story → 1.2 credits ($5.99)

Visual States

🟥 0 credits — blocked

