# Contributing

First off, thank you for considering contributing to Chessroulette. It's people like you that make a difference in open source. By contributing to Chessroulette, you agree to abide by the [Code of Conduct](https://github.com/movesthatmatter/chessroulette/blob/main/CODE_OF_CONDUCT.md).

Following these guidelines helps to communicate that you respect the time of the developers managing and developing this open source project. In return, they should reciprocate that respect in addressing your issue, assessing changes, and helping you finalize your pull requests.

## What can I contribute

Chessroulette is an open-source project and we love to receive contributions from our community — you!

Here are some ways you can contribute:

- Try building or deploying Chessrolette and give feedback.
- Help with open issues or create your own
- Share your thoughts and suggestions with us
- Help create tutorials and blog posts
- Request a feature by submitting a proposal
- Report a bug
- Improve documentation - fix incomplete or missing docs, bad wording, examples or explanations.

## Responsibilities

- Create issues for any major changes and enhancements that you wish to make. Discuss things transparently and get community feedback.
- Ensure all regression tests are passing after your change
- Keep feature versions as small as possible, preferably one new feature per version.
- Be welcoming to newcomers and encourage diverse new contributors from all backgrounds.

## Before You Contribute

### Make sure your commits are signed using SSH, GPG os S/MIME

This is **very important** so github can trace your contribution correctly, and avoid the following merging block message:
<img width="844" alt="Screenshot 2023-10-11 at 11 10 34 AM" src="https://github.com/movesthatmatter/movex/assets/2099521/d2d60b46-d609-4de6-a267-9bcfe63d08e6">

Please follow this guide to [learn more about signing commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification).

## Your First Contribution

Unsure where to begin contributing to Movex? You can start by looking through the _good-fist-issue_ and _help-wanted_ issues:

- Good first issues - issues which should only require a few lines of code, and a test or two.
- Help wanted issues - issues which should be a bit more involved than beginner issues.

> **Working on your first Pull Request?**
> You can learn how from this _free_ series [How to Contribute to an Open Source Project on GitHub](https://kcd.im/pull-request)

# Development

## Step 1. Clone the repo

Fork, then clone the repo:

git clone https://github.com/your-username/chessroulette.git

## Step 2. Build the Project

This repo uses Yarn for all package management.

## Step 3. Testing

`yarn test`

To continuously watch and run tests, run the following:

`yarn test --watch`

Alternatively, to skip the nx caches you can run:

`yarn test --watch -- --skip-nx-cache`

## Step 4. Run the project

Start the Client

`yarn start:client`

Start the Server (Movex)

`yarn start:movex`

## Step 4. Commit your changes

This repo uses [commitizen](https://github.com/commitizen/cz-cli) to keep the commits structured and tidy.

To commit run the following:

`yarn commit`

Optionally, if you'd like to keep running `git commit` you can configure the git hooks as in this [tutorial](https://github.com/commitizen/cz-cli#optional-running-commitizen-on-git-commit).

## Step 5. Sending a Pull Request

For non-trivial changes, please open an issue with a proposal for a new feature or refactoring before starting on the work. We don't want you to waste your efforts on a pull request that we won't want to accept.

In general, the contribution workflow looks like this:

1. Open a new issue in the Issue tracker.
1. Fork the repo.
1. Create a new feature branch based off the master branch.
1. Make sure all tests pass and there are no linting errors.
1. Submit a pull request, referencing any issues it addresses. [See Opening New PR Requirements](#opening-pull-request-requirements)
1. Please try to keep your pull request focused in scope and avoid including unrelated commits.

#### Opening Pull Request Requirements:

- A Pull Request always refers to an Open Issue.
- The Title of a Pull Request should look like '{ADD|FIX|REFACTOR|REVERT} "[{Issue Scope}]{Issue Title} #{Issue Id}"'.
- Reference the Issue it addresses in the Description of the PR by its Id, so when the PR gets merged the Issue gets closed automatically

After you have submitted your pull request, we'll try to get back to you as soon as possible. We may suggest some changes or improvements.

# Thank you for your contribution! 🙏
