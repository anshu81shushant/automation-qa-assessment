# Task 2 - Morning Brief (n8n)

Workflow file: `Task2_Workflow_AnshuJain.json`. Screenshots are in `screenshots/`.

## What it does

It runs every hour, or whenever you hit the webhook. It looks for new GitHub repos on a topic (default `ai-agents`, created in the last 7 days), sorted by stars. It keeps the top 5, pulls the README of the #1 repo, and posts a digest to Discord.

Flow: Schedule/Webhook > Config > GitHub search > Pick Top 5 > IF > (README > Hot digest) or (Quiet digest) > Discord

## APIs

- **GitHub search:** `GET /search/repositories?q=topic:ai-agents created:>DATE&sort=stars`. It's free, the docs are good, and there's no signup process for a key. "New repos getting stars fast" is basically a trending list, which is useful for a morning brief.
- **GitHub README:** `GET /repos/{owner}/{repo}/readme` with `Accept: application/vnd.github.raw+json` so it comes back as plain text. This is the enrichment step. The search result only has a one-line description, and the README usually explains what the project actually is.
- **Discord webhook** for output. It's free and quick to set up, and the webhook URL goes into n8n credentials instead of the node.

## Transformation

The "Pick Top 5" Code node:

- drops forks and archived repos
- sorts by stars and keeps 5
- reshapes each repo to name, url, stars, language and a short description, and marks it hot if it's above the threshold

"Build Hot Digest" strips the HTML, badges and images out of the README and takes the first proper paragraph (300 chars max). It also cuts the message down if it gets near Discord's 2000 character limit, because a long description list could push it over.

## IF node

`topStars >= threshold`. The default threshold is 500. When I checked the real data the top 5 were 741, 643, 471, 463 and 154 stars, so 500 splits them in a way that means something.

- **True:** fetch the README and send the full digest.
- **False:** don't bother with the README call, just send a short "quiet day" message. If nothing was found at all, it says that instead.

You can change the topic and threshold per run: `?topic=llm&threshold=1000`

## Error handling

- **GitHub search:** retries 3 times, 2s apart. If it still fails, it goes out the error output to a Code node that turns the error into something readable (e.g. "probably rate limited, check the token"), and that gets posted to Discord.
- **README call:** retries twice and has Continue On Fail on. If it fails, the digest still goes out, just with "README unavailable" in place of the summary. I didn't want one missing README to kill the whole brief.
- **No results:** handled in the code, so you get a message instead of an error.
- **Anything else** (e.g. Discord itself is down): the Error Trigger posts which node failed plus a link to the execution. This only works once you set the workflow as its own error workflow in Workflow Settings.

## Credentials

- **GitHub API:** a token with no scopes. It raises the limit from 60 to 5000 requests/hr.
- **Discord Webhook:** the webhook URL.

Pick them on the nodes after importing.

## Testing

I ran it on a local n8n and tried three cases:

- normal run
- `?threshold=100000`, to force the quiet branch
- a broken search URL, to make sure the error branch actually fires

```
curl "http://localhost:5678/webhook/morning-brief"
curl "http://localhost:5678/webhook/morning-brief?threshold=100000"
```
