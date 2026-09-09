# Mankind Minds Staff Manager

This desktop app lets staff sign in with their individual GitHub account, view
creator records, add or edit profiles, attach profile/gallery photos, and
publish a reviewable pull request to `TomTC73/MankindMindsBackend`.

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
attributes the branch, commits, and pull request to that account.

## Building an `.exe`

```powershell
pip install pyinstaller
pyinstaller --onefile --windowed app.py
```

The executable is created in `dist/app.exe`. Keep the GitHub OAuth client ID
configured in the environment of the staff computers before launching it.

## Publishing

Each publish creates a branch and pull request. Merge the pull request only
after checking the content and photos. The backend Cloud Build deployment then
deploys the versioned creator JSON and assets.
