# Mankind Minds Staff Manager

This desktop app lets staff sign in with their individual GitHub account, view
creator records, add or edit profiles, attach profile/gallery photos, and
manage tattoo shops on the public map. It publishes directly to the default
branch of `TomTC73/MankindMindsBackend`.

## Local use

Install Python 3.11+ and create a GitHub OAuth App with **Device Flow** enabled.
The distributed app includes the public OAuth client ID, so staff can normally
launch it by double-clicking. The app shows a clear sign-in and loading status,
refreshes creator records automatically, and provides guided fields for profile
sections and social links instead of requiring JSON editing. For development,
you may override the client ID with:

```powershell
$env:MM_GITHUB_CLIENT_ID = "your-public-github-client-id"
python app.py
```

The app never asks staff for a token. GitHub identifies the staff member and
attributes each direct commit to that account.

## Building an `.exe`

```powershell
pip install pyinstaller
pyinstaller --onefile --windowed app.py
```

The executable is created in `dist/app.exe`. Keep the GitHub OAuth client ID
configured in the environment of the staff computers before launching it.

After opening the app, sign in before editing anything. The creator, tattoo
shop, and ticket editors remain locked until you select an existing record or
choose the relevant **New** button, which prevents edits from being entered
without a record to save them to. Drafts can still be loaded and saved locally
before signing in, but publishing requires GitHub sign-in.

### Analytics setup

The **Analytics** tab uses the Mankind Minds backend for privacy-friendly
aggregate visitor reports. The public site sends anonymous page views to the
backend, without advertising cookies or user accounts. The tab shows current
visitors, all-time visitors and visits, page views, bounce rate, average visit
duration, top pages, countries, and cities.

## Publishing

Each publish commits directly to the backend repository's default branch and
automatically starts the backend deployment. The app waits for the deployment
workflow to finish and reports success or failure. The **Deploy latest GitHub
changes** button can also be used after adding several creators.

The **Tattoo shops** tab lets staff edit existing map entries or add a new
studio with its city, address, contact details, coordinates, artists, and
public description. **Publish all shops to GitHub** saves the complete map
dataset and starts the deployment automatically.

### Creator and account review

The **Creators > Creator pages** list is the unified directory of published
site pages and approved Firestore accounts. Each row labels its source: `SITE`
is a static website profile, `ACCOUNT` is a Firestore-backed profile, and
combined labels identify a page linked to an account. Static pages open in the
page editor; account-only profiles open in **Verified accounts**. For a page
linked to an account, **Open linked account** opens its Firestore record while
the page remains editable in the directory. Removing a site page leaves its
linked account in **Verified accounts**.

The **Verified accounts** tab manages Firestore profiles: staff can prepare
claim logins for existing pages, edit account details, send a password-reset
link, delete an account, or issue a temporary claim login. Account editing
keeps Description (creator cards and the top of the page), Bio (the About Work
section), and multiple social links separate. Account deletion is also
available from the pending and rejected queues. **Approve** lists pending
submissions and opens their profile details and submitted photos for review;
staff can approve or reject/block a request, and rejecting one sends a styled
email automatically. **Rejected** lists rejected accounts and allows a failed
rejection notice to be resent. **Tools** groups the Tattoo shops, To Do List,
Analytics, and Do it for them workspaces away from creator review.

Removing a selected creator page updates the latest `creators.json` on GitHub
before removing its unused assets, then starts the backend deployment. The
creator remains in the editor if the GitHub update fails so staff can retry.

The account tools use the same GitHub Device Flow sign-in. Configure
the backend's `STAFF_GITHUB_USERS` environment variable with a comma-separated
allowlist of GitHub usernames before deploying account management. Only those
GitHub identities can review, edit, delete, or request password resets for
member accounts, or manage email/IP bans. Staff can edit creator descriptions,
bios, social links, and profile details, upload profile and gallery photos,
and remove uploaded photos. Member photos and bios remain private until account
approval. IP bans are stored as keyed one-way
fingerprints; staff cannot retrieve the original IP from the account database.
Set `IP_FINGERPRINT_SECRET` to a separate high-entropy Secret Manager secret on
Cloud Run and keep it unchanged so bans and duplicate application checks remain
stable.

Approved member profiles appear in the site's existing Verified Creators
section as AI-Free verified artists. For self-service signups, accounts are
created only after the creator enters the one-time code emailed to their
address.

When staff approves a pending creator as AI-Free verified, the backend sends
them a congratulations email with their public profile link, suggested social
media caption, and a branded downloadable QR code that opens their profile.
The QR uses the bundled `Logo2` artwork and rounded blob-style modules, so
staff do not need the local `D:\QRCode` files or Python QR packages.

The **Tools > Do it for them** tab creates a public creator profile with its
description, bio, social links, profile photo, and gallery, then starts the
backend deployment and provisions its approved Firestore account. The entered
email is used to deliver the setup message and is not saved as verified account
email. The creator receives a temporary username and password, signs in at
`https://www.mankindminds.com/account`, verifies their own email, and chooses
their permanent password. If profile publishing succeeds but account email
delivery fails, retrying the same profile URL reuses that profile and issues
fresh temporary login details.

Use **Prepare logins for existing creators** to add approved, claim-required
accounts for the published creator pages. The existing public pages remain
published while their approved account profiles can be edited in place. The staff app shows each generated temporary sign-in
email and high-entropy password once; the `.invalid` email domain is only a
login identifier and cannot receive mail. Share the details securely. The
creator must verify an email address they control and choose a new password
before claiming the account. After import, **Issue / reset claim login**
generates replacement one-time credentials if needed. Closing the staff
manager removes temporary local photo-review files.

Account images are stored privately in the `mankind-minds-backend-account-media`
Cloud Storage bucket. Set `ACCOUNT_MEDIA_BUCKET` to that bucket name in the
backend service and grant the Cloud Run service account `Storage Object Admin`
on the bucket. Do not enable public bucket access; the backend only serves
approved public images after checking the account status.

For local account-photo development, set `ACCOUNT_MEDIA_BUCKET` to
`mankind-minds-backend-account-media` in the backend environment and authenticate
Application Default Credentials with `gcloud auth application-default login`.
The local identity must have object access to that bucket. For local staff-app
development, set `MM_ACCOUNT_API` to `http://localhost:8080/api/accounts`
before launching `app.py`.

To rebuild the scroll-enabled staff executable from this folder, run:

```powershell
python -m PyInstaller --noconfirm --clean MankindMindsStaffManagerScrollable.spec
```

The executable is written to `dist/MankindMindsStaffManagerScrollable.exe`.

### One-time backend deployment setup

The workflow file must be on the backend repository's default branch. In
`TomTC73/MankindMindsBackend`, add a repository secret named
`GCP_SERVICE_ACCOUNT_KEY`. Its value must be the JSON key for a Google Cloud
service account with permission to submit Cloud Builds and deploy the
`mankind-minds-api` Cloud Run service. The repository's
`.github/workflows/deploy-cloud-run.yml` workflow then accepts deployment
requests from the app.

After this one-time setup, staff do not need Google Cloud access or terminal
commands. The workflow also supports **Actions > Deploy backend to Cloud Run >
Run workflow** as a manual fallback.
