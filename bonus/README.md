# Bonus - Uptime monitor

Workflow file: `Bonus_UptimeMonitor_AnshuJain.json`. Screenshots are in `screenshots/`.

Every 5 minutes it checks the Task 1 app and posts to the same Discord channel as Task 2. It checks two URLs: the frontend (`https://demo.realworld.show/`) and the API (`https://api.realworld.show/api/tags`).

How it works:

- **Status code:** the HTTP node has "full response" and "never error" turned on, so a 404 or 500 comes through as normal data I can check instead of throwing. If there's no response at all (timeout, DNS), Continue On Fail is on and I record it as status 0.
- **Response time:** n8n doesn't give you request timing. So I loop over the targets one at a time, save `Date.now()` right before the request, and subtract it right after. Anything over 3s counts as slow.
- **Retry:** if a check isn't 200, it waits 30 seconds and checks again. It only alerts if the second check fails too, so one random blip doesn't send an alert.
- **Not spamming:** it remembers which targets are down (workflow static data). You get one DOWN alert when something goes down and one RECOVERED message when it comes back, with roughly how long it was down. Not an alert every 5 minutes.
- **Daily summary:** at 9am it posts uptime %, number of checks and failures, and average and max response time for each target. Then it resets the counts.

## Testing

I added a URL I knew would 404 as a third target. I got one DOWN alert after the 30s re-check. When I ran it again it didn't alert a second time, which is what I wanted. The daily summary showed the right uptime numbers.

I haven't actually watched the RECOVERED message fire yet. It's basically the reverse of the down check.

Static data only saves when the workflow is active, not on manual test runs, so the daily summary will only have data once the workflow is published.
