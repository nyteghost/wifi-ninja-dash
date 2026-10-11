# Wifi Ninja Dash

Create a mobile-friendly web dashboard and PWA to easily connect to a UniFi controller and toggle a Wi-Fi network named "Turbo Ninja Kids" on and off. Features should include:
- A clean, iOS-style mobile dashboard with a prominent master toggle for the "Turbo Ninja Kids" Wi-Fi network with instant visual feedback and status.
- Quick timer controls (e.g. Pause for 30 min, 1 hour, Bedtime off until morning).
- Connected client count and status overview for Turbo Ninja Kids.
- Settings modal to enter UniFi Site Manager API credentials or controller endpoint, saved securely in browser local storage so it can be hosted as a static site.
- An interactive demo/simulation mode so the UI can be tested immediately even before live credentials are entered.
- Installable PWA setup (manifest, mobile viewport, home screen icon prompts) so it can be added to an iPhone home screen.
- A GitHub Actions workflow configuration (.github/workflows/deploy.yml) and base-path support for seamless deployment to GitHub Pages.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3900563e-5fcb-4195-a6b2-5e81eb3db4ba).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
