# Reddit Save Logger

A personal, self-hosted tool for logging and organizing your Reddit saves 
and upvotes beyond Reddit's native limits, and with features Reddit 
doesn't offer.

## What This Is

Reddit allows you to save and upvote posts, but provides almost no tools 
for managing them long-term. Saves are capped at 1,000 items. There's no 
search, no filtering, no organization—just a reverse-chronological list. 
Posts you saved years ago are effectively lost.

Reddit Save Logger is a personal companion tool that solves this. It logs 
a reference to each post you save or upvote—the title, subreddit, 
permalink, and basic metadata—and gives you a proper interface for 
navigating, searching, and organizing that history over time.

Think of it as an automated spreadsheet with a GUI. The content lives on 
Reddit. This tool just keeps track of what you've flagged and helps you 
find it again.

## What It Does

- Logs a reference to each post you save or upvote via Reddit's API
- Removes the 1,000 item limit by maintaining a local index
- Adds search across your logged posts by title, subreddit, and your 
  own notes
- Adds filtering by date range, subreddit, score, post type, and more
- Lets you annotate posts with personal notes and tags
- Lets you organize posts into named collections
- Surfaces older saves through features like "On This Day" and shuffle

## What It Does Not Do

- Copy, store, or redistribute Reddit content of any kind
- Store post bodies, images, videos, or comments
- Access any content beyond the authenticated user's own saves and upvotes
- Interact with Reddit on behalf of the user beyond what they explicitly 
  trigger (voting, saving)
- Serve any users beyond the owner of the instance
- Collect or transmit any data to third parties

Every logged entry is a pointer back to Reddit — a permalink and metadata. 
Viewing a post opens it on Reddit.

## API Usage

This tool uses the following Reddit API endpoints:

- `GET /user/{username}/saved` — to log newly saved posts
- `GET /user/{username}/upvoted` — to log newly upvoted posts  
- `GET /api/v1/me` — to verify account identity on login
- `POST /api/v1/vote` — when the user explicitly votes
- `POST /save` / `POST /unsave` — when the user explicitly saves

API calls are made on a daily scheduled sync plus on-demand when the user 
manually triggers a sync. Usage is well within free tier rate limits. 
This is a low-volume personal tool—not a scraper, bot, or automated 
system acting independently of the user.

## Architecture

- Self-hosted on personal hardware (NAS), accessed privately
- Not publicly accessible — no public URL, no public instances
- React frontend, Node/Express backend, SQLite database
- All data stays on personal hardware and is never transmitted externally

## Authentication

Standard Reddit OAuth web flow. The user authenticates with their own 
Reddit credentials. The app stores a refresh token to maintain the session. 
No passwords are stored. No credentials are shared.

## Who This Is For

This is a personal tool built for my own use, self-hosted on my own 
hardware. It is not distributed, not offered as a service, and not 
intended for public use.

## Reddit API Compliance

This tool:
- Uses the official Reddit OAuth API exclusively
- Identifies itself honestly via User-Agent header
- Respects Reddit's rate limits
- Accesses only the authenticated user's own activity
- Is non-commercial, closed deployment, single user
- Does not scrape, index, or access public Reddit content at scale

## License

MIT — though since this is a personal tool, distribution is not the intent.