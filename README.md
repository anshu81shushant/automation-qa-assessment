# Automation & QA take-home - Anshu Jain

What's in here:

- `task1/` - QA report on the RealWorld "Conduit" demo ([Task1_QA_Report_AnshuJain.pdf](task1/Task1_QA_Report_AnshuJain.pdf)) plus the scripts I used for testing
- `task2/` - the n8n "morning brief" workflow ([Task2_Workflow_AnshuJain.json](task2/Task2_Workflow_AnshuJain.json)), [README](task2/README.md) and screenshots
- `bonus/` - uptime monitor workflow for the Task 1 app ([Bonus_UptimeMonitor_AnshuJain.json](bonus/Bonus_UptimeMonitor_AnshuJain.json)), [README](bonus/README.md) and screenshots

## Task 1

The demo.realworld.io link in the assignment doesn't work anymore (404), so I tracked down where it moved. It's demo.realworld.show now, and I tested that.

I went through all the main flows in the browser and then used some Python scripts against the API to try edge cases quicker. I also ran axe for accessibility and checked the headers.

I found 8 issues. The ones I'd fix first:

1. If you give an article a title that's just spaces (or just emoji), it gets saved with an empty slug. After that you can't open it or delete it. I picked this one for the root cause analysis.
2. Sign up accepts `not-an-email` with password `1`.
3. You can register the same email twice and end up with two separate accounts.
4. Logging in on a second device logs you out on the first one without saying anything.

The rest are in the PDF: security headers and CORS, accessibility, tags and pagination.

To re-run the checks:
- API tests: `python api_probes.py` and `python api_probes_accounts.py`
- UI tests: `npm install` in task1, then `node ui_flows.mjs` and `node two_device_session.mjs`

## Task 2

I used the GitHub API because it's free, doesn't need approval, and "new repos that are getting a lot of stars" is something I'd actually want to see every morning.

- It takes the top 5 and enriches the #1 repo with a summary of its README.
- The IF node checks whether the top repo has at least 500 stars. I picked 500 after looking at real results for a week of the `ai-agents` topic.
- Above 500 you get the full digest. Below it, it skips the README call and posts a short "quiet day" message.
- Errors don't get swallowed. The GitHub call retries, and if it still fails a readable alert goes to Discord. The README call is allowed to fail without killing the digest, and an Error Trigger catches anything else.

More detail in [task2/README.md](task2/README.md).

## Setup

1. Run n8n (`npx n8n` or Docker) and import the two JSON files.
2. Add two credentials in n8n:
   - a GitHub token (no scopes needed, it's just for the higher rate limit)
   - a Discord webhook URL
3. Select those credentials on the GitHub and Discord nodes.
4. For the Error Trigger to work, set the workflow as its own error workflow in Workflow Settings.
5. Test with `curl "http://localhost:5678/webhook/morning-brief"` once it's published, or `/webhook-test/...` while in test mode.

## Notes

- The demo is public and shared, so I used throwaway accounts and didn't do any load testing.
- Built and tested on n8n 2.41.4.
