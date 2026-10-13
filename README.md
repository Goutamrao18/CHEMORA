🧪 CHEMORA

Touch. Mix. React.

CHEMORA is an interactive chemistry learning experience designed as an interactive chemistry learning website where students can explore experiments, discover chemicals, investigate mysteries, and test their chemistry knowledge.

🌐 Live Website: https://project-draft-three.vercel.app/

---

## 🧱 Repository layout & commands

| Path | What it is |
|---|---|
| `/` | Static learning site (Home, Know, Challenge, Progress, Experiments, Account) |
| `api/` | Vercel serverless function (`/api/assistant`) |
| `game/` | CHEMORA 3D Lab game (Vite + React + Three.js), published at **`/play/`** |
| `scripts/` | Validators, tests, dist assembly, local server |
| `Makefile` | Single entry point — run `make help` |
| `dist/` | Generated deploy output (git-ignored): site at `/`, game at `/play/` |

Requirements: Node 22+, pnpm 10, GNU make.

```bash
make install     # game dependencies
make dev         # game dev server (http://localhost:5173/)
make dev-site    # static site only (http://localhost:4173/)
make verify      # validate + tests + typecheck + lint + production build + dist check
make build       # production build -> dist/
make preview     # serve dist/ exactly as deployed
```

Vercel runs `make build` and serves `dist/` (see `vercel.json`). Security-audit documents live in `docs/security/`.

---


🧪 About CHEMORA

CHEMORA turns chemistry learning into an interactive experience.

Instead of only reading theory, users can:

- 🧪 Explore chemistry experiments
- 🧬 Discover chemicals and their properties
- 🔬 Learn about laboratory equipment
- ⚗️ Explore chemical reactions
- 🔍 Investigate unknown substances
- 🧠 Test their chemistry knowledge through challenges

The goal is to make chemistry more interactive, visual, and engaging.

---

✨ Main Sections

🧪 KNOW

The Know section is the learning library of CHEMORA.

It includes information about:

- 🧪 Experiments
- 🧬 Chemicals
- 🔬 Laboratory tools
- ⚗️ Chemistry concepts
- 📚 Practical chemistry

Users can explore chemistry information before attempting practical activities.

---

🔍 MYSTERY

The Mystery section turns chemistry into an investigation.

Users investigate clues and try to identify an unknown substance or solve a chemistry-related problem.

This section focuses on:

- Observation
- Logical reasoning
- Chemical properties
- Identification
- Problem solving

---

🧠 CHALLENGE

The Challenge section allows users to test their chemistry knowledge.

Challenges can be used to practice:

- Chemistry concepts
- Chemical properties
- Reactions
- Laboratory knowledge
- General chemistry understanding

---

🔬 Experiments

CHEMORA provides an Experiments section where users can explore practical chemistry.

The purpose is to help students understand:

1. What an experiment does
2. What equipment is required
3. What chemicals are involved
4. What observations can be made
5. Why the reaction occurs
6. What conclusion can be drawn

---

🧬 Chemicals

The Chemicals section helps users discover different substances used in chemistry.

Information can include:

- Chemical name
- Formula
- Properties
- Uses
- Observations
- Laboratory applications
- Safety information

This section is intended as a quick chemistry reference.

---

🔬 Laboratory Tools

CHEMORA also includes information about laboratory equipment.

Examples include:

- Test tubes
- Beakers
- Conical flasks
- Measuring cylinders
- Burettes
- Pipettes
- Funnels
- Thermometers
- Balances
- Tripod stands
- Wire gauze
- And other chemistry laboratory equipment

The purpose is to help students recognize laboratory equipment and understand its uses.

---

🎯 Learning Experience

CHEMORA follows four major learning actions:

LEARN → EXPLORE → INVESTIGATE → CHALLENGE

Users can first learn chemistry concepts, explore practical chemistry, investigate unknowns, and finally test their knowledge.

---

🖥️ Website

Home

The homepage introduces CHEMORA as a:

«interactive chemistry learning website»

with the tagline:

«Touch. Mix. React.»

It provides navigation to the main learning sections.

---

🛠️ Technologies

CHEMORA is built using web technologies such as:

- HTML5
- CSS3
- JavaScript
- Local browser storage where required
- Web-based interactive components
- Vercel deployment

---

📁 Project Structure

CHEMORA/
│
├── index.html            Home page
├── account.html / .css   Account and progress page
├── app.js                Shared navigation, search and theme logic
├── voice-assistant.js    AI assistant (calls /api/assistant on Vercel)
├── style.css, v2-enhancements.css, modern-overhaul.css, reference-ui.css
│
├── know/                 Chemicals, lab tools and concepts library
├── challenge/            100-level quiz (data/level-001.json … level-100.json)
├── experiments/          Guided practicals with videos
├── api/assistant.js      Serverless AI assistant endpoint
├── assets/, videos/, favicon.png
└── README.md

---

🚀 Run Locally

1. Clone the repository

git clone YOUR_GITHUB_REPOSITORY_URL

2. Open the project

cd CHEMORA

3. Run the website

You can simply open:

index.html

in your browser.

For development, using VS Code + Live Server is recommended.

---

🌐 Deployment

CHEMORA is deployed using Vercel.

Deploy with Vercel

1. Upload the project to GitHub.
2. Open Vercel.
3. Import the GitHub repository.
4. Select the project.
5. Deploy.

After deployment, Vercel provides a public website URL.

Live Version

🌐 https://project-draft-three.vercel.app/

---

📱 Responsive Design

CHEMORA is designed for modern devices, including:

- 📱 Mobile phones
- 📲 Tablets
- 💻 Laptops
- 🖥️ Desktop computers

---

🎨 Design Philosophy

CHEMORA is designed around the idea that chemistry should feel like an experience rather than just a textbook.

The interface focuses on:

- Clean navigation
- Interactive sections
- Chemistry-themed visuals
- Easy-to-understand information
- Practical learning
- Investigation
- Challenge-based learning

---

🧪 Core Concept

CHEMORA is built around three simple actions:

TOUCH
   ↓
MIX
   ↓
REACT

These represent the interactive nature of chemistry and the philosophy behind the website.

---

🔮 Future Improvements

Possible future features include:

- 👤 User accounts
- ☁️ Cloud progress synchronization
- 🏆 Achievements and badges
- 📊 Learning statistics
- 🔥 Daily chemistry challenges
- 🧪 More experiments
- 🧬 Larger chemical database
- 🔬 More laboratory tools
- 🔍 More mystery investigations
- 🤖 AI chemistry assistant
- 🌙 Dark mode
- 🔊 Audio explanations
- 🌐 Multiple language support
- 📱 Progressive Web App support

---

⚠️ Safety

CHEMORA is an educational project.

The website should not be used as a replacement for proper laboratory supervision.

Users should:

- Follow laboratory safety rules.
- Wear appropriate protective equipment.
- Never taste laboratory chemicals.
- Never mix unknown chemicals outside a supervised educational setting.
- Follow instructions from qualified teachers or laboratory personnel.

---

📚 Educational Purpose

CHEMORA is designed to support chemistry education and practical understanding.

It can be useful for students learning:

- Basic chemistry
- Laboratory equipment
- Chemical properties
- Chemical reactions
- Practical chemistry
- Observation and identification
- Chemistry problem solving

---

🚧 Project Status

CHEMORA is currently under development.

New experiments, chemicals, laboratory tools, challenges, and interactive features can be added as the project grows.

---

👨‍💻 Development

When contributing to CHEMORA:

1. Keep the existing design consistent.
2. Use reusable CSS and JavaScript.
3. Optimize images before adding them.
4. Test on both mobile and desktop.
5. Keep chemistry information accurate.
6. Follow appropriate laboratory safety guidelines.
7. Do not expose private API keys or credentials.

---

📄 License

This project is currently intended for educational purposes.

If CHEMORA is released publicly, add an appropriate open-source license and ensure that all third-party images, fonts, libraries, icons, and other assets comply with their respective licenses.

---

🧪 CHEMORA

Touch. Mix. React.

Explore • React • Discover

«An Interactive Chemistry Learning Experience.»

## CHEMORA V6 visual upgrade
Added `modern-overhaul.css`, loaded last on every HTML page. It provides a consistent modern glass/neon visual system, responsive spacing, upgraded cards, inputs, navigation, challenge UI, experiments, account dashboard, Know library, home sections, and AI assistant without replacing the existing chemistry data or application logic.


## Local development quick start

This is a static-first website with serverless API handlers. Use Node.js 18 or newer for local tooling.

1. Install dependencies if your workflow requires them: `npm install`.
2. Run the static pages with a local static server from the project root.
3. Configure required environment variables in your deployment environment; never commit secrets.
4. Test the home page, knowledge library, challenges, experiments, account page, theme toggle, global search, and assistant before deploying.


## One-shot upgrade bundle

The consolidated package includes the Learning Progress dashboard, PWA/offline shell, AI endpoint hardening, security headers, and project validation.

Run `npm run validate:project`, `npm run test:smoke`, and `npm run test:experiments` with Node.js 18+ to validate challenge data, required files, basic AI endpoint error handling, and experiment-section markup/media references. See `ONE-SHOT-UPGRADE.md` for included changes and production steps that require Vercel/Supabase access.


## Engineering audit and future releases

See `SENIOR-ENGINEER-AUDIT.md` for checks and known limitations, and `FUTURE-UPDATE-LOG.md` for the prioritized release plan and future update log.
