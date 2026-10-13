# CHEMORA: GitHub + Vercel Deployment Guide

This archive is **repository-root ready**: `index.html`, `package.json`, `vercel.json`, `api/`, and the other project folders are at the top level. Do not upload this ZIP as the only file in a GitHub repository; extract it first so the source files are in the repository root.

## 1. Extract the ZIP

Extract `CHEMORA-git-ready.zip` into a folder named `CHEMORA`. Confirm that `index.html`, `package.json`, and `vercel.json` are directly inside that folder (not inside another nested `CHEMORA/CHEMORA` folder).

## 2. Upload to GitHub

Recommended: use GitHub Desktop or Git on a computer, because this project contains more than 100 files and includes media. The GitHub website limits browser uploads to 100 files at a time and 25 MiB per file.

### GitHub Desktop
1. Create an empty repository on GitHub. Do not initialize it with a README or license if you plan to publish the existing project folder directly.
2. In GitHub Desktop, choose **File → Add Local Repository** and select the extracted `CHEMORA` folder. If it is not already a Git repository, choose the option to create a repository in that folder.
3. Review the changed files. Ensure no `.env` file or private API key is included. `.gitignore` already excludes `.env` and `.vercel/`.
4. Commit the files, then publish/push the repository to GitHub.

### Git command line alternative
Run these commands from the extracted project folder, replacing the example URL with your repository URL:

```bash
git init -b main
git add .
git commit -m "Prepare CHEMORA for deployment"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

If Git says this folder already has a remote or repository, inspect that existing setup instead of repeating `git init` or overwriting the remote.

## 3. Import the repository into Vercel

1. In the Vercel dashboard, choose **Add New → Project** and import the GitHub repository.
2. Set **Framework Preset** to **Other**.
3. Set **Root Directory** to `./` (the repository root).
4. The repository now contains the static site **and** the `game/` project. `vercel.json` already sets the install command (`make install`), build command (`make build`) and output directory (`dist`), so leave the dashboard overrides empty. Set **Node.js Version** to 22.x. The build publishes the site at `/` and the game at `/play/`.
5. Deploy. Future pushes to the connected production branch will trigger new deployments.

## 4. Configure the AI environment variable

In Vercel, open **Project → Settings → Environment Variables** and add:

- `OPENROUTER_API_KEY` — required, private server-side key from OpenRouter.
- `OPENROUTER_MODEL` — optional; defaults to `openrouter/free`.
- `SITE_URL` — optional; set this to the final HTTPS URL for your CHEMORA website.

Enable the variables for the environments you use (at least Production; also Preview if you want AI on preview deployments), save, then redeploy so the function receives them. **Never put the OpenRouter API key in HTML, browser JavaScript, Git, or this ZIP.** The site can load without the AI key, but AI answers will return unavailable until it is configured.

## 5. Confirm the domain before production sharing

The project’s earlier documentation and some SEO metadata may still contain `project-draft-three.vercel.app`. After Vercel assigns your real URL/domain, search the project for that placeholder and replace it with the actual production URL where appropriate (canonical URLs, sitemap, Open Graph metadata, robots/sitemap references, README, and the AI referer fallback). Set `SITE_URL` to the same HTTPS URL. Do not replace it with the email domain unless that is also the website domain.

## 6. Verify after deployment

- Open `/`, `/know/know.html`, `/challenge/challenge.html`, `/experiments/experiments.html`, `/progress.html`, `/account.html`, and `/privacy.html`.
- Confirm images/videos/styles load and browser DevTools has no failed local assets.
- Test `POST /api/assistant` only after adding `OPENROUTER_API_KEY`.
- Test sign-in/sign-up, profile/avatar actions, and redirect URLs against the configured Supabase project. These live services cannot be fully verified just by building the ZIP.
- Run the included checks from the project folder with Node.js 18 or newer:

```bash
npm run validate:project
npm run test:smoke
npm run test:experiments
```

The package does not automatically upload or deploy anything; you control both the Git push and Vercel deployment.
