# Chessroulette

Chessroulette is an online platform that combines chess gameplay with real-time video interaction. It allows you to play one-on-one matches with friends or new opponents, join virtual classrooms for studying chess with instructors, and connect through video chat while playing. Designed to make online chess more interactive and personal, Chess Roulette helps players learn, play, and connect with ease.

<div align="center">

[![License][license-image]][license-url]
[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/movesthatmatter/chessroulette/issues)

[license-image]: https://img.shields.io/badge/license-MIT-green
[license-url]: https://github.com/movesthatmatter/chessroulette/blob/main/LICENSE

</div>

## 🙏 Contributing

First off, thank you for showing an interest in contributing to the Chessroulette project! We have created a [Contributing Guide](https://github.com/movesthatmatter/chessroulette/blob/main/CONTRIBUTING.md) that will show you how to setup a development environment and how to open pull requests and submit changes.

## 💾 Project Setup

Chessroulette is using a handful of services to function properly.

<a href="https://movex.dev" target="_blank">
  <picture width="200">
    <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/2099521/242976573-84d1ea96-1859-43a7-ac0c-d2f1e0f1b882.png" width="200">
    <img alt="Movex Logo" src="https://user-images.githubusercontent.com/2099521/242976534-60d063cd-3283-45e3-aac5-bd8ed0eb8946.png" width="200">
  </picture>
</a>

- **Movex**: The Multiplayer Infrastructure. Learn more at [movex.dev](https://movex.dev).
- **Turn Server**: Ensuring the WebRTC connects even behind firewals or complex network systems via [Twilio](https://www.twilio.com).
- **Signaling Server**: Providing the WebRTC handshaking mechanism via [Peerjs](https://github.com/peers/peerjs).
- **Chess Engine Server**: Stockfish, Leela, etc.

### 🚀 Build & Run

1. Install the Dependencies

```bash
yarn
```

1. Create an Env file `.env.local` at the project root, and duplicate the sample variables found at `sample.env` into it. Replace the "TBD" values with your own tokens!

```bash
touch .env.file; cat sample.env > .env.file
```

1. Start the Client

```bash
yarn start:client
```

1. In a separate Terminal, start the Server (Movex)

```bash
yarn start:movex
```

1. Navigate to `localhost:4200` and enjoy your experience!

## 🛡️ License

Movex is licensed under the MIT License - see the [LICENSE](https://github.com/movesthatmatter/movex/blob/main/LICENSE) file for details.

## 👽 Community

[Join our Discord](https://discord.gg/hudVbHH4m8)

## 🥷 Thanks To All Contributors

Movex wouldn't be the same without you, so thank you all for your amazing efforts and contribution!

<a href="https://github.com/movesthatmatter/chessroulette/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=movesthatmatter/chessroulette&v=2" alt="Contributors" />
</a>

Made with [contrib.rocks](https://contrib.rocks).
