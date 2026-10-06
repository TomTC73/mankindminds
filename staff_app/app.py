"""Mankind Minds staff creator manager.

Run with `python app.py` or package with:
    pyinstaller --onefile --windowed --name MankindMindsStaffManager app.py
"""

import base64
import json
import mimetypes
import os
import re
import threading
import time
import tempfile
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
import tkinter as tk
from tkinter import filedialog, messagebox, ttk


OWNER = "TomTC73"
REPO = "MankindMindsBackend"
DATA_PATH = "backend/src/main/resources/data/creators.json"
STUDIO_DATA_PATH = "backend/src/main/resources/data/studios.json"
TICKET_DATA_PATH = "backend/staff/tickets.json"
ASSET_PATH = "backend/src/main/resources/static/assets"
STUDIO_ASSET_PATH = ASSET_PATH + "/studios"
API = "https://api.github.com"
DEPLOYMENT_EVENT = "deploy-backend"
DEPLOYMENT_WORKFLOW = ".github/workflows/deploy-cloud-run.yml"
ANALYTICS_API = "https://mankind-minds-api-151580998157.europe-west2.run.app/api/analytics"
ACCOUNT_API = os.environ.get(
    "MM_ACCOUNT_API",
    "https://mankind-minds-api-151580998157.europe-west2.run.app/api/accounts",
)
CREATOR_NICHES = ("Tattooist", "Musician", "Writer", "Content Creator", "Artist", "Illustrator", "Photographer")
LEGACY_NICHE_MAP = {
    "Tattoos": "Tattooist",
    "Music": "Musician",
    "Writing": "Writer",
    "Videos": "Content Creator",
    "Art": "Artist",
}
ACCOUNT_CATEGORY_MAP = {
    "Tattooist": "Tattoos",
    "Musician": "Music",
    "Writer": "Writing",
    "Content Creator": "Videos",
    "Artist": "Art",
    "Illustrator": "Art",
    "Photographer": "Art",
}
CLIENT_ID = os.environ.get("MM_GITHUB_CLIENT_ID", "Ov23liZIMcO7043zppb9")
REFRESH_MS = 60_000
PALETTE = {
    "ink": "#20201e",
    "muted": "#6c6861",
    "paper": "#f4f1eb",
    "panel": "#fbfaf7",
    "line": "#d8d0c5",
    "accent": "#984132",
}
STANDARD_REVIEW_CONTENT = (
    "Mankind Minds reviews the materials submitted by each creator to assess "
    "whether their creative output is human-made and free from AI generation. "
    "The review considers the creator's submitted work, process, portfolio "
    "links, and supporting evidence. Based on the reviewed materials, this "
    "creator profile has been approved as AI-free."
)
STANDARD_BADGE = "Verified Creator"
STANDARD_CARD = {
    "title": "AI-Free Verification",
    "description": "This creator's submitted work and process have been reviewed by Mankind Minds and approved as human-made.",
    "status": "Proven AI-Free Creator",
}
DRAFT_PATH = os.path.join(os.environ.get("APPDATA", os.path.expanduser("~")), "MankindMindsStaffManager", "draft.json")


class GitHubError(RuntimeError):
    pass


class GitHubClient:
    def __init__(self, token):
        self.token = token

    def request(self, method, path, payload=None):
        data = None if payload is None else json.dumps(payload).encode()
        request = urllib.request.Request(API + path, data=data, method=method)
        request.add_header("Accept", "application/vnd.github+json")
        request.add_header("X-GitHub-Api-Version", "2022-11-28")
        request.add_header("Authorization", "Bearer " + self.token)
        if data:
            request.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                raw = response.read()
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", "replace")
            raise GitHubError(f"GitHub returned {error.code}: {detail}") from error

    def current_user(self):
        return self.request("GET", "/user")

    def repository(self):
        return self.request("GET", f"/repos/{OWNER}/{REPO}")

    def file(self, path, ref):
        encoded = urllib.parse.quote(path, safe="/")
        return self.request("GET", f"/repos/{OWNER}/{REPO}/contents/{encoded}?ref={urllib.parse.quote(ref)}")

    def branch_sha(self, branch):
        result = self.request("GET", f"/repos/{OWNER}/{REPO}/git/ref/heads/{urllib.parse.quote(branch, safe='')}")
        return result["object"]["sha"]

    def create_branch(self, branch, sha):
        return self.request("POST", f"/repos/{OWNER}/{REPO}/git/refs", {
            "ref": "refs/heads/" + branch,
            "sha": sha,
        })

    def put_file(self, path, content, branch, message, sha=None):
        payload = {
            "message": message,
            "content": base64.b64encode(content).decode("ascii"),
            "branch": branch,
        }
        if sha:
            payload["sha"] = sha
        encoded = urllib.parse.quote(path, safe="/")
        return self.request("PUT", f"/repos/{OWNER}/{REPO}/contents/{encoded}", payload)

    def delete_file(self, path, branch, message, sha):
        encoded = urllib.parse.quote(path, safe="/")
        return self.request("DELETE", f"/repos/{OWNER}/{REPO}/contents/{encoded}", {
            "message": message,
            "branch": branch,
            "sha": sha,
        })

    def trigger_deployment(self):
        return self.request("POST", f"/repos/{OWNER}/{REPO}/dispatches", {
            "event_type": DEPLOYMENT_EVENT,
        })

    def deployment_workflow(self, ref):
        return self.file(DEPLOYMENT_WORKFLOW, ref)

    def deployment_runs(self):
        return self.request(
            "GET",
            f"/repos/{OWNER}/{REPO}/actions/workflows/deploy-cloud-run.yml/runs?per_page=10",
        )

    def deployment_run(self, run_id):
        return self.request("GET", f"/repos/{OWNER}/{REPO}/actions/runs/{run_id}")


class AnalyticsClient:
    def __init__(self, base_url):
        self.base_url = base_url

    def request(self, path, params=None):
        query = urllib.parse.urlencode(params or {})
        url = f"{self.base_url}{path}?{query}"
        request = urllib.request.Request(url, method="GET")
        request.add_header("Accept", "application/json")
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.loads(response.read())
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", "replace")
            raise RuntimeError(f"Analytics API returned {error.code}: {detail}") from error

    def aggregate(self):
        return self.request("/summary")

    def breakdown(self, dimension, limit=10):
        return self.request("/breakdown", {"dimension": dimension, "limit": limit})


class AccountAdminClient:
    def __init__(self, token, base_url=ACCOUNT_API):
        self.token = token
        self.base_url = base_url.rstrip("/")

    def request(self, method, path, payload=None):
        data = None if payload is None else json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(self.base_url + path, data=data, method=method)
        request.add_header("Accept", "application/json")
        request.add_header("Authorization", "Bearer " + self.token)
        if data:
            request.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                raw = response.read()
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", "replace")
            raise RuntimeError(f"Account API returned {error.code}: {detail}") from error

    def accounts(self):
        return self.request("GET", "/staff")

    def set_status(self, account_id, status):
        return self.request("PUT", f"/staff/{urllib.parse.quote(account_id, safe='')}/status", {"status": status})

    def issue_claim_credentials(self, account_id):
        return self.request("POST", f"/staff/{urllib.parse.quote(account_id, safe='')}/claim-credentials")

    def import_legacy_claim(self, creator):
        return self.request("POST", "/staff/legacy-claim", creator)

    def create_creator_account(self, creator, email):
        return self.request("POST", "/staff/do-it-for-them", {
            "creator": creator,
            "email": email,
        })

    def resend_rejection_email(self, account_id):
        return self.request("POST", f"/staff/{urllib.parse.quote(account_id, safe='')}/rejection-email")

    def update_profile(self, account_id, profile):
        return self.request("PUT", f"/staff/{urllib.parse.quote(account_id, safe='')}/profile", profile)

    def delete_account(self, account_id):
        return self.request("DELETE", f"/staff/{urllib.parse.quote(account_id, safe='')}")

    def upload_image(self, account_id, file_path, kind):
        with open(file_path, "rb") as image:
            content = image.read()
        if not content or len(content) > 5 * 1024 * 1024:
            raise ValueError("Choose an image no larger than 5 MB.")
        content_type = mimetypes.guess_type(file_path)[0] or "application/octet-stream"
        boundary = "----MankindMinds" + os.urandom(16).hex()
        filename = os.path.basename(file_path).replace('"', "")
        body = (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="kind"\r\n\r\n{kind}\r\n'
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
            f"Content-Type: {content_type}\r\n\r\n"
        ).encode("utf-8") + content + f"\r\n--{boundary}--\r\n".encode("utf-8")
        request = urllib.request.Request(
            self.base_url + f"/staff/{urllib.parse.quote(account_id, safe='')}/images",
            data=body,
            method="POST",
        )
        request.add_header("Accept", "application/json")
        request.add_header("Authorization", "Bearer " + self.token)
        request.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                return json.loads(response.read())
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", "replace")
            raise RuntimeError(f"Account API returned {error.code}: {detail}") from error

    def delete_image(self, account_id, image_id):
        return self.request(
            "DELETE",
            f"/staff/{urllib.parse.quote(account_id, safe='')}/images/{urllib.parse.quote(image_id, safe='')}",
        )

    def download_image(self, account_id, image_id):
        url = self.base_url + (
            f"/staff/{urllib.parse.quote(account_id, safe='')}/images/"
            f"{urllib.parse.quote(image_id, safe='')}"
        )
        request = urllib.request.Request(url, method="GET")
        request.add_header("Accept", "image/jpeg,image/png,image/webp")
        request.add_header("Authorization", "Bearer " + self.token)
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                content_type = response.headers.get_content_type()
                if content_type not in ("image/jpeg", "image/png", "image/webp"):
                    raise RuntimeError("The account service returned an unsupported photo type.")
                return response.read(), content_type
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", "replace")
            raise RuntimeError(f"Account API returned {error.code}: {detail}") from error

    def reset_password(self, account_id):
        return self.request("POST", f"/staff/{urllib.parse.quote(account_id, safe='')}/password-reset")

    def bans(self):
        return self.request("GET", "/staff/bans")

    def add_ban(self, ban_type, value):
        return self.request("POST", "/staff/bans", {"type": ban_type, "value": value})

    def remove_ban(self, ban_id):
        return self.request("DELETE", f"/staff/bans/{urllib.parse.quote(ban_id, safe='')}")


def request_json(url, payload):
    request = urllib.request.Request(url, data=urllib.parse.urlencode(payload).encode(), method="POST")
    request.add_header("Accept", "application/json")
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read())

def normalize_creator_profile(creator):
    profile = dict(creator)
    about_section = next(
        (
            section for section in profile.get("sections", [])
            if section.get("title", "").lower().startswith("about ")
        ),
        None,
    )
    about_bio = about_section.get("content", "") if about_section else ""
    legacy_intro = profile.get("bio", "")
    if about_bio and legacy_intro and legacy_intro != about_bio:
        profile["description"] = legacy_intro
        profile["bio"] = about_bio
    return profile


def creator_page_rows(creators, accounts, selected_category="All categories", query=""):
    legacy_slugs = {
        str(creator.get("slug", "")).casefold()
        for creator in creators
        if creator.get("slug")
    }
    rows = list(creators)
    account_rows = []
    for account in accounts:
        if account.get("status") != "APPROVED" or account.get("claimRequired"):
            continue
        legacy_slug = str(account.get("legacyCreatorSlug", "")).casefold()
        account_slug = str(account.get("creatorSlug", "")).casefold()
        if legacy_slug in legacy_slugs or account_slug in legacy_slugs:
            continue
        account_rows.append({
            "name": str(account.get("displayName") or ""),
            "category": LEGACY_NICHE_MAP.get(
                account.get("category"), account.get("category", ""),
            ),
            "_account_id": account.get("id"),
        })
    rows.extend(sorted(account_rows, key=lambda row: str(row["name"]).casefold()))

    normalized_query = query.casefold()
    return [
        row for row in rows
        if (
            selected_category == "All categories"
            or LEGACY_NICHE_MAP.get(row.get("category"), row.get("category", "")) == selected_category
        )
        and (
            normalized_query in str(row.get("name", "")).casefold()
            or normalized_query in str(row.get("category", "")).casefold()
        )
    ]


def login_device(on_device_code=None):
    if not CLIENT_ID:
        raise GitHubError("No GitHub OAuth client ID is configured.")
    device = request_json("https://github.com/login/device/code", {
        "client_id": CLIENT_ID,
        "scope": "repo",
    })
    if on_device_code:
        on_device_code(device["user_code"])
    webbrowser.open(device["verification_uri"])
    interval = int(device.get("interval", 5))
    while True:
        time.sleep(interval)
        token = request_json("https://github.com/login/oauth/access_token", {
            "client_id": CLIENT_ID,
            "device_code": device["device_code"],
            "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
        })
        if token.get("access_token"):
            return token["access_token"], device["user_code"]
        if token.get("error") not in ("authorization_pending", "slow_down"):
            raise GitHubError(token.get("error_description", "GitHub sign-in failed."))
        if token.get("error") == "slow_down":
            interval += 5


class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Mankind Minds | Staff Manager")
        self.geometry("1240x820")
        self.minsize(980, 650)
        self.configure(bg=PALETTE["paper"])
        self.client = None
        self.account_admin = None
        self.account_rows = {}
        self.suggested_rows = {}
        self.rejected_rows = {}
        self.temporary_photo_dirs = []
        self.ban_rows = {}
        self.creators = []
        self.selected = None
        self.photo_path = None
        self.gallery_paths = []
        self.gallery_replacements = {}
        self.gallery_deleted = []
        self.gallery_tree = None
        self.studios = []
        self.selected_studio = None
        self.studio_fields = {}
        self.studio_photo_path = None
        self.current_login = ""
        self.analytics = AnalyticsClient(ANALYTICS_API)
        self.tickets = []
        self.ticket_file_sha = None
        self.section_rows = []
        self.social_rows = []
        self.creator_records_loaded = False
        self.syncing_creator_bio = False
        self.creator_editor_enabled = False
        self.studio_editor_enabled = False
        self.ticket_editor_enabled = False
        self.do_it_social_rows = []
        self.do_it_profile_photo = None
        self.do_it_gallery_photos = []
        self.build_styles()
        self.build_ui()
        self.protocol("WM_DELETE_WINDOW", self.close_app)
        self.after(REFRESH_MS, self.auto_refresh)

    def close_app(self):
        for temporary_dir in self.temporary_photo_dirs:
            temporary_dir.cleanup()
        self.destroy()

    def build_styles(self):
        style = ttk.Style(self)
        style.theme_use("clam")
        style.configure(".", background=PALETTE["paper"], foreground=PALETTE["ink"], font=("Segoe UI", 10))
        style.configure("TFrame", background=PALETTE["paper"])
        style.configure("Panel.TFrame", background=PALETTE["panel"])
        style.configure("Title.TLabel", background=PALETTE["paper"], foreground=PALETTE["ink"], font=("Georgia", 25))
        style.configure("Subtitle.TLabel", background=PALETTE["paper"], foreground=PALETTE["muted"], font=("Segoe UI", 10))
        style.configure("Section.TLabel", background=PALETTE["panel"], foreground=PALETTE["ink"], font=("Segoe UI Semibold", 11))
        style.configure("Muted.TLabel", background=PALETTE["panel"], foreground=PALETTE["muted"])
        style.configure("Accent.TButton", background=PALETTE["ink"], foreground="#ffffff", padding=(15, 9))
        style.map("Accent.TButton", background=[("active", PALETTE["accent"])])
        style.configure("Outline.TButton", background=PALETTE["panel"], foreground=PALETTE["ink"], padding=(12, 8))
        style.configure("TEntry", fieldbackground="#ffffff", bordercolor=PALETTE["line"], padding=7)
        style.configure("TCombobox", fieldbackground="#ffffff", background="#ffffff", padding=6)
        style.configure("Treeview", background="#ffffff", fieldbackground="#ffffff", foreground=PALETTE["ink"], rowheight=34)
        style.configure("Treeview.Heading", background=PALETTE["ink"], foreground="#ffffff", font=("Segoe UI Semibold", 10))
        style.configure("Status.TLabel", background=PALETTE["paper"], foreground=PALETTE["muted"], font=("Segoe UI", 9))
        style.configure("Footer.TButton", padding=(14, 10), font=("Segoe UI Semibold", 10))

    def build_ui(self):
        header = ttk.Frame(self, padding=(28, 22, 28, 16))
        header.pack(fill="x")
        ttk.Label(header, text="Mankind Minds", style="Title.TLabel").pack(anchor="w")
        ttk.Label(header, text="Creator records and publishing workspace", style="Subtitle.TLabel").pack(anchor="w", pady=(3, 0))

        toolbar = ttk.Frame(header)
        toolbar.place(relx=1, rely=0.2, anchor="ne")
        self.user_label = ttk.Label(toolbar, text="Not signed in", style="Subtitle.TLabel")
        self.user_label.pack(side="left", padx=(0, 14))
        self.sign_in_button = ttk.Button(toolbar, text="Sign in with GitHub", style="Accent.TButton", command=self.sign_in)
        self.sign_in_button.pack(side="left")

        footer = ttk.Frame(self, padding=(22, 10, 22, 18))
        footer.pack(fill="x", side="bottom")
        footer.columnconfigure(0, weight=1)
        self.status = ttk.Label(footer, text="Sign in to load creator records.", style="Status.TLabel")
        self.status.grid(row=0, column=0, sticky="w", padx=(0, 16))
        footer_buttons = ttk.Frame(footer)
        footer_buttons.grid(row=0, column=1, sticky="e")
        self.load_draft_button = ttk.Button(footer_buttons, text="Load draft", style="Footer.TButton", command=self.load_draft)
        self.load_draft_button.pack(side="left", padx=(8, 0))
        self.save_draft_button = ttk.Button(footer_buttons, text="Save draft", style="Footer.TButton", command=self.save_draft)
        self.save_draft_button.pack(side="left", padx=(8, 0))
        self.refresh_button = ttk.Button(footer_buttons, text="Refresh", style="Footer.TButton", command=self.load_users)
        self.refresh_button.pack(side="left", padx=(8, 0))
        self.deploy_button = ttk.Button(
            footer_buttons,
            text="Deploy latest GitHub changes",
            style="Footer.TButton",
            command=self.deploy_latest,
        )
        self.deploy_button.pack(side="left", padx=(8, 0))
        self.publish_button = ttk.Button(
            footer_buttons,
            text="Publish changes to website",
            style="Accent.TButton",
            command=self.publish,
        )
        self.publish_button.pack(side="left", padx=(8, 0))
        self.refresh_button.config(state="disabled")
        self.deploy_button.config(state="disabled")
        self.publish_button.config(state="disabled")

        tabs = ttk.Notebook(self)
        tabs.pack(fill="both", expand=True, padx=22, pady=(0, 16))
        self.tabs = tabs
        creators_tab = ttk.Frame(tabs, style="Panel.TFrame")
        tabs.add(creators_tab, text="Creators")
        self.creators_subtabs = ttk.Notebook(creators_tab)
        self.creators_subtabs.pack(fill="both", expand=True)
        main = ttk.Panedwindow(self.creators_subtabs, orient="horizontal")
        self.creators_subtabs.add(main, text="Creator pages")
        tattoo_creators_tab = ttk.Frame(self.creators_subtabs, style="Panel.TFrame", padding=20)
        self.creators_subtabs.add(tattoo_creators_tab, text="Tattoo creators")
        left = ttk.Frame(main, style="Panel.TFrame", padding=16)
        right = ttk.Frame(main, style="Panel.TFrame", padding=20)
        preview = ttk.Frame(main, style="Panel.TFrame", padding=16)
        main.add(left, weight=1)
        main.add(right, weight=3)
        main.add(preview, weight=2)

        list_header = ttk.Frame(left, style="Panel.TFrame")
        list_header.pack(fill="x")
        ttk.Label(list_header, text="Creators", style="Section.TLabel").pack(side="left")
        self.count_label = ttk.Label(list_header, text="0", style="Muted.TLabel")
        self.count_label.pack(side="right")
        self.creator_category = ttk.Combobox(
            left, values=("All categories",) + CREATOR_NICHES, state="readonly",
        )
        self.creator_category.set("All categories")
        self.creator_category.bind("<<ComboboxSelected>>", lambda _event: self.refresh_list())
        self.creator_category.pack(fill="x", pady=(12, 0))
        self.search = ttk.Entry(left)
        self.search.insert(0, "Search creators...")
        self.search.bind("<FocusIn>", self.clear_search_placeholder)
        self.search.bind("<KeyRelease>", lambda _event: self.refresh_list())
        self.search.pack(fill="x", pady=(8, 10))
        self.user_list = ttk.Treeview(left, columns=("category",), show="tree headings", selectmode="browse")
        self.user_list.heading("#0", text="Name")
        self.user_list.heading("category", text="Category")
        self.user_list.column("#0", width=175)
        self.user_list.column("category", width=95)
        self.user_list.pack(fill="both", expand=True)
        self.user_list.bind("<<TreeviewSelect>>", self.select_user)
        self.new_creator_button = ttk.Button(left, text="+  New creator", style="Outline.TButton", command=self.new_user)
        self.new_creator_button.pack(fill="x", pady=(12, 0))
        self.remove_creator_button = ttk.Button(left, text="Remove selected creator", command=self.remove_selected_creator)
        self.remove_creator_button.pack(fill="x", pady=(8, 0))

        self.canvas = tk.Canvas(right, background=PALETTE["panel"], highlightthickness=0)
        scrollbar = ttk.Scrollbar(right, orient="vertical", command=self.canvas.yview)
        self.form = ttk.Frame(self.canvas, style="Panel.TFrame")
        self.form.bind("<Configure>", lambda _event: self.canvas.configure(scrollregion=self.canvas.bbox("all")))
        self.canvas.create_window((0, 0), window=self.form, anchor="nw", tags="form")
        self.canvas.configure(yscrollcommand=scrollbar.set)
        self.canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        self.canvas.bind_all("<MouseWheel>", self.scroll_form)
        self.build_form()
        self.set_creator_editor_enabled(False)
        ttk.Label(preview, text="Live preview", style="Section.TLabel").pack(anchor="w")
        ttk.Label(preview, text="This is how the public profile will read.", style="Muted.TLabel").pack(anchor="w", pady=(2, 10))
        self.preview_text = tk.Text(
            preview, wrap="word", state="disabled", bg="#ffffff", fg=PALETTE["ink"],
            relief="solid", borderwidth=1, padx=18, pady=18,
        )
        self.preview_text.pack(fill="both", expand=True)
        self.preview_text.tag_configure("title", font=("Georgia", 22), spacing3=8)
        self.preview_text.tag_configure("heading", font=("Georgia", 14), spacing1=12, spacing3=4)
        self.preview_text.tag_configure("label", foreground=PALETTE["accent"], font=("Segoe UI Semibold", 9))
        self.update_preview()
        self.build_tattoo_creators_panel(tattoo_creators_tab)
        self.accounts_tab = ttk.Frame(self.creators_subtabs, style="Panel.TFrame", padding=20)
        self.creators_subtabs.add(self.accounts_tab, text="Verified accounts")
        self.build_account_admin(self.accounts_tab)

        suggested_tab = ttk.Frame(tabs, style="Panel.TFrame", padding=20)
        tabs.add(suggested_tab, text="Approve")
        self.build_suggested_artist_queue(suggested_tab)

        rejected_tab = ttk.Frame(tabs, style="Panel.TFrame", padding=20)
        tabs.add(rejected_tab, text="Rejected")
        self.build_rejected_account_queue(rejected_tab)

        tools_tab = ttk.Frame(tabs, style="Panel.TFrame", padding=20)
        tabs.add(tools_tab, text="Tools")
        tool_sections = ttk.Notebook(tools_tab)
        tool_sections.pack(fill="both", expand=True)
        shops_tab = ttk.Frame(tool_sections, style="Panel.TFrame", padding=20)
        tool_sections.add(shops_tab, text="Tattoo shops")
        self.build_studio_editor(shops_tab)
        self.set_studio_editor_enabled(False)
        tickets_tab = ttk.Frame(tool_sections, style="Panel.TFrame", padding=20)
        tool_sections.add(tickets_tab, text="To Do List")
        self.build_ticket_editor(tickets_tab)
        self.set_ticket_editor_enabled(False)
        analytics_tab = ttk.Frame(tool_sections, style="Panel.TFrame", padding=20)
        tool_sections.add(analytics_tab, text="Analytics")
        self.build_analytics_panel(analytics_tab)
        do_it_tab = ttk.Frame(tool_sections, style="Panel.TFrame", padding=20)
        tool_sections.add(do_it_tab, text="Do it for them")
        self.build_do_it_for_them(do_it_tab)

    def build_account_admin(self, parent):
        parent.columnconfigure(0, weight=1)
        parent.rowconfigure(2, weight=1)
        parent.rowconfigure(6, weight=1)
        ttk.Label(parent, text="Verified creator accounts", style="Section.TLabel").grid(row=0, column=0, sticky="w")
        ttk.Label(
            parent,
            text="Existing public pages are VERIFIED; creators must verify their own sign-in email.",
            style="Muted.TLabel",
        ).grid(row=0, column=1, sticky="e")
        self.account_refresh_button = ttk.Button(parent, text="Refresh", command=self.load_account_admin)
        self.account_refresh_button.grid(row=0, column=2, sticky="e")

        self.account_category = ttk.Combobox(
            parent, values=("All categories", "Tattoos", "Music", "Writing", "Videos", "Art"),
            state="readonly", width=20,
        )
        self.account_category.set("All categories")
        self.account_category.bind("<<ComboboxSelected>>", lambda _event: self.refresh_approved_account_tree())
        self.account_category.grid(row=1, column=0, sticky="w", pady=(10, 0))
        self.verified_legacy_count = ttk.Label(
            parent, text="Published pages and approved profiles are listed under Creator pages.", style="Muted.TLabel",
        )
        self.verified_legacy_count.grid(row=1, column=1, sticky="e", pady=(10, 0))
        self.legacy_import_button = ttk.Button(
            parent, text="Prepare logins for existing creators", command=self.prepare_legacy_claim_logins,
        )
        self.legacy_import_button.grid(row=1, column=2, sticky="e", pady=(10, 0))
        self.legacy_import_button.config(state="disabled")
        self.account_tree = ttk.Treeview(
            parent,
            columns=("email", "username", "name", "category", "verification", "email_verified", "photos"),
            show="headings",
            selectmode="browse",
        )
        for column, title, width in (
            ("email", "Email / temporary login", 220),
            ("username", "Temporary username", 150),
            ("name", "Creator", 170),
            ("category", "Category", 120),
            ("verification", "Creator status", 110),
            ("email_verified", "Email verified", 110),
            ("photos", "Photos", 75),
        ):
            self.account_tree.heading(column, text=title)
            self.account_tree.column(column, width=width)
        self.account_tree.grid(row=2, column=0, columnspan=3, sticky="nsew", pady=(12, 8))
        self.account_tree.bind("<<TreeviewSelect>>", self.select_account)

        detail_frame = ttk.LabelFrame(parent, text="Selected creator page details", padding=10)
        detail_frame.grid(row=3, column=0, columnspan=2, sticky="ew", pady=(8, 0))
        self.account_detail_text = tk.Text(
            detail_frame, height=5, wrap="word", state="disabled",
            background="#ffffff", foreground=PALETTE["ink"], relief="solid", borderwidth=1,
        )
        self.account_detail_text.pack(fill="x", expand=True)

        photo_frame = ttk.LabelFrame(parent, text="Member profile photos", padding=10)
        photo_frame.grid(row=4, column=0, columnspan=2, sticky="ew", pady=(8, 0))
        photo_frame.columnconfigure(0, weight=1)
        self.account_photo_tree = ttk.Treeview(
            photo_frame,
            columns=("kind", "id"),
            show="headings",
            height=3,
            selectmode="browse",
        )
        self.account_photo_tree.heading("kind", text="Photo")
        self.account_photo_tree.heading("id", text="Photo identifier")
        self.account_photo_tree.column("kind", width=110)
        self.account_photo_tree.column("id", width=330)
        self.account_photo_tree.bind("<<TreeviewSelect>>", self.select_account_photo)
        self.account_photo_tree.grid(row=0, column=0, columnspan=3, sticky="ew")
        photo_actions = ttk.Frame(photo_frame, style="Panel.TFrame")
        photo_actions.grid(row=1, column=0, columnspan=3, sticky="w", pady=(8, 0))
        self.account_upload_profile_button = ttk.Button(
            photo_actions, text="Set profile photo", command=lambda: self.upload_selected_account_photo("profile"),
        )
        self.account_upload_profile_button.pack(side="left")
        self.account_upload_gallery_button = ttk.Button(
            photo_actions, text="Add gallery photo", command=lambda: self.upload_selected_account_photo("gallery"),
        )
        self.account_upload_gallery_button.pack(side="left", padx=(8, 0))
        self.account_delete_photo_button = ttk.Button(
            photo_actions, text="Delete selected photo", command=self.delete_selected_account_photo,
        )
        self.account_delete_photo_button.pack(side="left", padx=(8, 0))

        actions = ttk.Frame(parent, style="Panel.TFrame")
        actions.grid(row=5, column=0, columnspan=2, sticky="w", pady=(8, 0))
        self.account_edit_button = ttk.Button(actions, text="Edit details", command=self.edit_selected_account)
        self.account_edit_button.pack(side="left", padx=(8, 0))
        self.account_reset_button = ttk.Button(actions, text="Send password reset", command=self.reset_selected_account_password)
        self.account_reset_button.pack(side="left", padx=(8, 0))
        self.account_claim_button = ttk.Button(actions, text="Issue / reset claim login", command=self.issue_selected_claim_credentials)
        self.account_claim_button.pack(side="left", padx=(8, 0))
        self.account_delete_button = ttk.Button(actions, text="Delete account", command=self.delete_selected_account)
        self.account_delete_button.pack(side="left", padx=(8, 0))

        ban_frame = ttk.LabelFrame(parent, text="Banned email addresses and IPs", padding=12)
        ban_frame.grid(row=6, column=0, columnspan=2, sticky="nsew", pady=(18, 0))
        ban_frame.columnconfigure(1, weight=1)
        self.ban_type = ttk.Combobox(ban_frame, values=("email", "ip"), state="readonly", width=10)
        self.ban_type.set("email")
        self.ban_type.grid(row=0, column=0, sticky="w")
        self.ban_value = ttk.Entry(ban_frame)
        self.ban_value.grid(row=0, column=1, sticky="ew", padx=8)
        self.ban_value.insert(0, "")
        self.ban_button = ttk.Button(ban_frame, text="Add ban", command=self.add_account_ban)
        self.ban_button.grid(row=0, column=2)
        self.ban_tree = ttk.Treeview(ban_frame, columns=("type", "label"), show="headings", height=4)
        self.ban_tree.heading("type", text="Type")
        self.ban_tree.heading("label", text="Blocked address (IP shown as fingerprint)")
        self.ban_tree.column("type", width=90)
        self.ban_tree.column("label", width=320)
        self.ban_tree.grid(row=1, column=0, columnspan=2, sticky="ew", pady=(10, 0))
        self.unban_button = ttk.Button(ban_frame, text="Remove selected ban", command=self.remove_selected_ban)
        self.unban_button.grid(row=1, column=2, padx=(8, 0), pady=(10, 0), sticky="n")

    def build_suggested_artist_queue(self, parent):
        parent.columnconfigure(0, weight=1)
        parent.rowconfigure(1, weight=1)
        heading = ttk.Frame(parent, style="Panel.TFrame")
        heading.grid(row=0, column=0, sticky="ew")
        heading.columnconfigure(0, weight=1)
        ttk.Label(heading, text="Approve submitted creators", style="Section.TLabel").grid(row=0, column=0, sticky="w")
        ttk.Label(
            heading,
            text="Review verified-email submissions. Rejections automatically email the creator.",
            style="Muted.TLabel",
        ).grid(row=1, column=0, sticky="w", pady=(4, 0))
        self.suggested_refresh_button = ttk.Button(
            heading, text="Refresh", command=self.load_account_admin,
        )
        self.suggested_refresh_button.grid(row=0, column=1, rowspan=2, sticky="e", padx=(16, 0))

        self.suggested_artist_tree = ttk.Treeview(
            parent,
            columns=("name", "category", "email", "photos"),
            show="headings",
            selectmode="browse",
        )
        for column, title, width in (
            ("name", "Creator", 220),
            ("category", "Category", 150),
            ("email", "Email", 280),
            ("photos", "Photos", 75),
        ):
            self.suggested_artist_tree.heading(column, text=title)
            self.suggested_artist_tree.column(column, width=width)
        self.suggested_artist_tree.grid(row=1, column=0, sticky="nsew", pady=(16, 10))
        self.suggested_artist_tree.bind("<<TreeviewSelect>>", self.select_suggested_artist)
        actions = ttk.Frame(parent, style="Panel.TFrame")
        actions.grid(row=2, column=0, sticky="w")
        self.suggested_review_button = ttk.Button(
            actions, text="Review profile & photos", command=self.open_suggested_artist,
        )
        self.suggested_review_button.pack(side="left")
        self.suggested_approve_button = ttk.Button(
            actions, text="Approve as AI-Free verified", command=lambda: self.set_selected_suggested_status("APPROVED"),
        )
        self.suggested_approve_button.pack(side="left", padx=(8, 0))
        self.suggested_reject_button = ttk.Button(
            actions, text="Reject / block request", command=lambda: self.set_selected_suggested_status("REJECTED"),
        )
        self.suggested_reject_button.pack(side="left", padx=(8, 0))
        self.suggested_delete_button = ttk.Button(
            actions, text="Delete account", command=self.delete_selected_suggested_account,
        )
        self.suggested_delete_button.pack(side="left", padx=(8, 0))
        self.select_suggested_artist()

    def build_rejected_account_queue(self, parent):
        parent.columnconfigure(0, weight=1)
        parent.rowconfigure(1, weight=1)
        heading = ttk.Frame(parent, style="Panel.TFrame")
        heading.grid(row=0, column=0, sticky="ew")
        heading.columnconfigure(0, weight=1)
        ttk.Label(heading, text="Rejected creator accounts", style="Section.TLabel").grid(row=0, column=0, sticky="w")
        ttk.Label(
            heading, text="Rejections are emailed automatically. Use resend if delivery needs to be retried.",
            style="Muted.TLabel",
        ).grid(row=1, column=0, sticky="w", pady=(4, 0))
        ttk.Button(heading, text="Refresh", command=self.load_account_admin).grid(
            row=0, column=1, rowspan=2, sticky="e", padx=(16, 0),
        )
        self.rejected_artist_tree = ttk.Treeview(
            parent, columns=("name", "category", "email", "reviewed"), show="headings", selectmode="browse",
        )
        for column, title, width in (
            ("name", "Creator", 220), ("category", "Category", 150),
            ("email", "Email", 280), ("reviewed", "Reviewed", 180),
        ):
            self.rejected_artist_tree.heading(column, text=title)
            self.rejected_artist_tree.column(column, width=width)
        self.rejected_artist_tree.grid(row=1, column=0, sticky="nsew", pady=(16, 10))
        self.rejected_artist_tree.bind("<<TreeviewSelect>>", self.select_rejected_artist)
        self.resend_rejection_button = ttk.Button(
            parent, text="Resend rejection email", command=self.resend_selected_rejection,
        )
        self.resend_rejection_button.grid(row=2, column=0, sticky="w")
        self.rejected_delete_button = ttk.Button(
            parent, text="Delete account", command=self.delete_selected_rejected_account,
        )
        self.rejected_delete_button.grid(row=2, column=0, sticky="w", padx=(170, 0))
        self.select_rejected_artist()

    def select_rejected_artist(self, _event=None):
        selection = self.rejected_artist_tree.selection()
        enabled = bool(selection and self.rejected_rows.get(selection[0]) and self.account_admin)
        self.resend_rejection_button.config(state="normal" if enabled else "disabled")
        self.rejected_delete_button.config(state="normal" if enabled else "disabled")

    def resend_selected_rejection(self):
        selection = self.rejected_artist_tree.selection()
        account = self.rejected_rows.get(selection[0]) if selection else None
        if not account:
            return
        if not messagebox.askyesno(
            "Resend rejection email",
            f"Resend the rejection notice to {account.get('email', 'this creator')}?",
        ):
            return
        self.account_admin_action(
            "Resend rejection email",
            lambda: self.account_admin.resend_rejection_email(account["id"]),
            "Rejection email sent.",
        )

    def selected_suggested_artist(self):
        selection = self.suggested_artist_tree.selection()
        return self.suggested_rows.get(selection[0]) if selection else None

    def select_suggested_artist(self, _event=None):
        enabled = bool(self.selected_suggested_artist()) and bool(self.account_admin)
        state = "normal" if enabled else "disabled"
        for button in (
            self.suggested_review_button,
            self.suggested_approve_button,
            self.suggested_reject_button,
            self.suggested_delete_button,
        ):
            button.config(state=state)

    def delete_selected_suggested_account(self):
        account = self.selected_suggested_artist()
        self.delete_account_record(account)

    def delete_selected_rejected_account(self):
        selection = self.rejected_artist_tree.selection()
        account = self.rejected_rows.get(selection[0]) if selection else None
        self.delete_account_record(account)

    def delete_account_record(self, account):
        if not account:
            return
        if not messagebox.askyesno(
            "Permanently delete creator account",
            f"Permanently delete {account.get('email', 'this account')}, including its uploaded photos and sign-in sessions?",
        ):
            return
        self.account_admin_action(
            "Delete creator account",
            lambda: self.account_admin.delete_account(account["id"]),
            "Creator account and uploaded photos deleted.",
        )

    def open_suggested_artist(self):
        account = self.selected_suggested_artist()
        if not account:
            return
        window = tk.Toplevel(self)
        window.title("Review creator submission")
        window.transient(self)
        window.grab_set()
        body = ttk.Frame(window, padding=20)
        body.pack(fill="both", expand=True)
        ttk.Label(body, text=account.get("displayName", "Creator submission"), style="Section.TLabel").grid(
            row=0, column=0, columnspan=2, sticky="w", pady=(0, 12),
        )
        rows = (
            ("Email", account.get("email", "")),
            ("Email verified", "Yes" if account.get("emailVerified") else "No"),
            ("Category", account.get("category", "")),
            ("Business / studio", account.get("businessName", "")),
            ("Business contact", account.get("businessContactName", "")),
            ("Business email", account.get("businessEmail", "")),
        )
        for row_index, (label, value) in enumerate(rows, start=1):
            ttk.Label(body, text=label + ":", style="Muted.TLabel").grid(
                row=row_index, column=0, sticky="nw", padx=(0, 12), pady=4,
            )
            ttk.Label(body, text=value or "—", wraplength=520).grid(
                row=row_index, column=1, sticky="nw", pady=4,
            )
        description_row = len(rows) + 1
        self.add_readonly_review_text(
            body, description_row, "Description", account.get("description", ""),
        )
        bio_row = description_row + 1
        self.add_readonly_review_text(body, bio_row, "Bio / About work", account.get("bio", ""))
        social_links = account.get("socialLinks") or [{
            "name": account.get("socialPlatform", ""),
            "url": account.get("socialHandle", ""),
        }]
        social_row = bio_row + 1
        ttk.Label(body, text="Social links:", style="Muted.TLabel").grid(
            row=social_row, column=0, sticky="nw", padx=(0, 12), pady=4,
        )
        social_text = tk.Text(body, width=66, height=min(5, max(2, len(social_links))), wrap="word",
                              relief="solid", borderwidth=1)
        social_text.insert(
            "1.0",
            "\n".join(f"{link.get('name', 'Link')}: {link.get('url', '')}" for link in social_links),
        )
        social_text.config(state="disabled")
        social_text.grid(row=social_row, column=1, sticky="ew", pady=4)
        photos = len(account.get("galleryImageIds", [])) + bool(account.get("profileImageId"))
        ttk.Label(body, text=f"Uploaded photos: {photos}").grid(
            row=social_row + 1, column=1, sticky="w", pady=(8, 0),
        )
        dialog_actions = ttk.Frame(body)
        dialog_actions.grid(row=social_row + 2, column=0, columnspan=2, sticky="ew", pady=(14, 0))
        ttk.Button(dialog_actions, text="Close", command=window.destroy).pack(side="right")
        if photos:
            ttk.Button(
                dialog_actions, text="Open submitted photos",
                command=lambda: self.open_suggested_photos(account),
            ).pack(side="right", padx=(0, 8))
        body.columnconfigure(1, weight=1)

    @staticmethod
    def add_readonly_review_text(parent, row, label, value):
        ttk.Label(parent, text=label + ":", style="Muted.TLabel").grid(
            row=row, column=0, sticky="nw", padx=(0, 12), pady=4,
        )
        text = tk.Text(parent, width=66, height=5, wrap="word", relief="solid", borderwidth=1)
        text.insert("1.0", value or "")
        text.config(state="disabled")
        text.grid(row=row, column=1, sticky="ew", pady=4)

    def open_suggested_photos(self, account):
        images = []
        if account.get("profileImageId"):
            images.append(account["profileImageId"])
        images.extend(account.get("galleryImageIds", []))
        if not images:
            return
        self.set_status("Downloading private submission photos...", PALETTE["accent"])

        def work():
            temporary_dir = tempfile.TemporaryDirectory(prefix="mankind-minds-review-")
            paths = []
            try:
                extensions = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
                for index, image_id in enumerate(images, start=1):
                    content, content_type = self.account_admin.download_image(account["id"], image_id)
                    path = os.path.join(temporary_dir.name, f"submission-{index}{extensions[content_type]}")
                    with open(path, "wb") as image_file:
                        image_file.write(content)
                    paths.append(path)
                self.after(0, lambda: self.open_review_image_files(temporary_dir, paths))
            except Exception as error:
                temporary_dir.cleanup()
                self.after(0, lambda message=str(error): messagebox.showerror("Could not open submission photos", message))
                self.after(0, lambda: self.set_status("Could not load submission photos.", PALETTE["accent"]))

        threading.Thread(target=work, daemon=True).start()

    def open_review_image_files(self, temporary_dir, paths):
        try:
            for path in paths:
                os.startfile(path)
        except OSError as error:
            temporary_dir.cleanup()
            messagebox.showerror("Could not open submission photo", str(error))
            self.set_status("Could not open submission photo.", PALETTE["accent"])
            return
        self.temporary_photo_dirs.append(temporary_dir)
        self.set_status(
            "Submission photos opened. Temporary review files will be removed when the staff app closes.",
            "#46705b",
        )

    def set_selected_suggested_status(self, status):
        account = self.selected_suggested_artist()
        if not account:
            return
        approving = status == "APPROVED"
        title = "Approve creator" if approving else "Reject creator request"
        message = (
            f"Approve {account.get('displayName', 'this creator')} as AI-Free verified? "
            "Their profile will become public in Verified Creators."
            if approving
            else f"Reject {account.get('displayName', 'this creator')}? They will receive an automatic rejection email."
        )
        if not messagebox.askyesno(title, message):
            return
        self.account_admin_action(
            title,
            lambda: self.account_admin.set_status(account["id"], status),
            "Creator approved as AI-Free verified. No website publish is needed."
            if approving else "Creator request rejected and rejection email sent.",
            on_success=lambda: messagebox.showinfo(
                "Creator approved" if approving else "Creator rejected",
                (
                    f"{account.get('displayName', 'Creator')} is approved. The website's creator lists "
                    "will include the profile automatically; do not press Publish changes."
                    if approving else
                    f"{account.get('displayName', 'Creator')} was rejected and the rejection email was sent."
                ),
            ),
        )

    def selected_account(self):
        selection = self.account_tree.selection()
        return self.account_rows.get(selection[0]) if selection else None

    def select_account(self, _event=None):
        enabled = bool(self.selected_account()) and bool(self.account_admin)
        state = "normal" if enabled else "disabled"
        for button in (
            self.account_edit_button,
            self.account_claim_button,
            self.account_delete_button,
        ):
            button.config(state=state)
        self.account_reset_button.config(
            state="normal" if enabled and not self.selected_account().get("claimRequired") else "disabled",
        )
        for button in (self.account_upload_profile_button, self.account_upload_gallery_button):
            button.config(state=state)
        self.account_delete_photo_button.config(state="disabled")
        self.account_photo_tree.delete(*self.account_photo_tree.get_children())
        account = self.selected_account()
        self.account_detail_text.config(state="normal")
        self.account_detail_text.delete("1.0", tk.END)
        if account:
            legacy_profile = next(
                (
                    creator for creator in self.creators
                    if creator.get("slug") == account.get("legacyCreatorSlug")
                ),
                {},
            )
            social_links = account.get("socialLinks")
            if social_links is None:
                social_links = legacy_profile.get("socialLinks") or [{
                    "name": account.get("socialPlatform", ""),
                    "url": account.get("socialHandle", ""),
                }]
            details = (
                f"{account.get('displayName', '')} · {account.get('category', '')}\n"
                f"Email: {account.get('email', '')}\n"
                f"Business: {account.get('businessName', '')} · Contact: {account.get('businessContactName', '')} "
                f"{account.get('businessEmail', '')}\n\n"
                f"Description:\n{account.get('description', '')}\n\n"
                f"Bio:\n{account.get('bio', '')}\n\n"
                "Social links:\n"
                + "\n".join(
                    f"{link.get('name', 'Link')}: {link.get('url', '')}"
                    for link in social_links
                )
            )
            self.account_detail_text.insert("1.0", details.strip())
            profile_image_id = account.get("profileImageId")
            if profile_image_id:
                self.account_photo_tree.insert("", "end", iid=profile_image_id, values=("Profile", profile_image_id))
            for image_id in account.get("galleryImageIds", []):
                self.account_photo_tree.insert("", "end", iid=image_id, values=("Gallery", image_id))
        self.account_detail_text.config(state="disabled")

    def select_account_photo(self, _event=None):
        enabled = bool(self.selected_account()) and bool(self.account_admin)
        selected = bool(self.account_photo_tree.selection()) and enabled
        self.account_delete_photo_button.config(state="normal" if selected else "disabled")

    def load_account_admin(self, silent=False):
        if not self.client:
            if not silent:
                self.set_status("Sign in with GitHub before managing member accounts.", PALETTE["accent"])
            return
        self.account_admin = AccountAdminClient(self.client.token)
        self.refresh_do_it_for_them_state()
        self.set_status("Loading member accounts...", PALETTE["accent"])

        def work():
            try:
                rows = self.account_admin.accounts()
                bans = self.account_admin.bans()
                self.after(0, lambda: self.refresh_account_admin(rows, bans))
            except Exception as error:
                self.after(0, lambda: messagebox.showerror("Could not load member accounts", str(error)))

        threading.Thread(target=work, daemon=True).start()

    def refresh_account_admin(self, rows, bans):
        self.suggested_artist_tree.delete(*self.suggested_artist_tree.get_children())
        self.rejected_artist_tree.delete(*self.rejected_artist_tree.get_children())
        self.account_rows = {}
        self.suggested_rows = {}
        self.rejected_rows = {}
        for account in rows:
            account_id = account.get("id")
            if not account_id:
                continue
            self.account_rows[account_id] = account
            if account.get("status") == "PENDING":
                self.suggested_rows[account_id] = account
                self.suggested_artist_tree.insert(
                    "",
                    "end",
                    iid=account_id,
                    values=(
                        account.get("displayName", ""),
                        account.get("category", ""),
                        account.get("email", ""),
                        len(account.get("galleryImageIds", [])) + bool(account.get("profileImageId")),
                    ),
                )
            elif account.get("status") == "REJECTED":
                self.rejected_rows[account_id] = account
                self.rejected_artist_tree.insert(
                    "",
                    "end",
                    iid=account_id,
                    values=(
                        account.get("displayName", ""),
                        account.get("category", ""),
                        account.get("email", ""),
                        str(account.get("reviewedAt", ""))[:19].replace("T", " "),
                    ),
                )
        self.refresh_approved_account_tree()
        self.refresh_list(silent=True)
        self.ban_tree.delete(*self.ban_tree.get_children())
        self.ban_rows = {}
        for ban in bans:
            ban_id = ban.get("id")
            if not ban_id:
                continue
            self.ban_rows[ban_id] = ban
            self.ban_tree.insert(
                "",
                "end",
                iid=ban_id,
                values=(ban.get("type", ""), ban.get("label", "")),
            )
        self.select_account()
        self.select_suggested_artist()
        self.select_rejected_artist()
        pending_count = sum(1 for account in rows if account.get("status") == "PENDING")
        rejected_count = len(self.rejected_rows)
        approved_count = sum(1 for account in rows if account.get("status") == "APPROVED")
        self.set_status(
            f"Loaded {approved_count} verified member accounts and {len(self.creators)} existing site pages marked VERIFIED; "
            f"{pending_count} awaiting review, {rejected_count} rejected, {len(bans)} active bans.",
            "#46705b",
        )

    def refresh_approved_account_tree(self):
        self.account_tree.delete(*self.account_tree.get_children())
        category = self.account_category.get() if hasattr(self, "account_category") else "All categories"
        approved = [
            account for account in self.account_rows.values()
            if account.get("status") == "APPROVED"
            and (category == "All categories" or account.get("category") == category)
        ]
        approved.sort(key=lambda account: account.get("displayName", "").casefold())
        for account in approved:
            account_id = account["id"]
            self.account_tree.insert(
                "",
                "end",
                iid=account_id,
                values=(
                    account.get("email", ""),
                    account.get("loginUsername", "")
                    if account.get("loginUsername") != account.get("email") else "",
                    account.get("displayName", ""),
                    account.get("category", ""),
                    "VERIFIED",
                    "Yes" if account.get("emailVerified") else "No",
                    len(account.get("galleryImageIds", [])) + bool(account.get("profileImageId")),
                ),
            )
        self.select_account()

    def prepare_legacy_claim_logins(self):
        if not self.account_admin:
            messagebox.showerror("Prepare creator logins", "Sign in with an authorized staff GitHub account first.")
            return
        if not self.creators:
            messagebox.showerror("Prepare creator logins", "Load the existing creator pages before preparing logins.")
            return
        if not messagebox.askyesno(
            "Prepare existing creator logins",
            f"Create missing claim logins for {len(self.creators)} existing public creator pages? "
            "Their current pages will stay published and marked VERIFIED. Each creator must verify their real email "
            "and choose a new password before claiming the account.",
        ):
            return

        category_map = {
            "Tattooist": "Tattoos",
            "Musician": "Music",
            "Writer": "Writing",
            "Content Creator": "Videos",
            "Artist": "Art",
            "Illustrator": "Art",
            "Photographer": "Art",
        }
        requests = []
        for creator in self.creators:
            social_links = creator.get("socialLinks", [])
            primary_link = social_links[0] if social_links else {}
            requests.append({
                "slug": creator.get("slug", ""),
                "name": creator.get("name", ""),
                "category": category_map.get(creator.get("category"), "Art"),
                "socialPlatform": primary_link.get("name") or "Other",
                "socialHandle": primary_link.get("url", ""),
                "description": creator.get("description", ""),
                "bio": creator.get("bio", ""),
                "socialLinks": social_links,
                "businessName": creator.get("studio", ""),
            })

        self.legacy_import_button.config(state="disabled")
        self.set_status("Preparing verified creator claim logins...", PALETTE["accent"])

        def work():
            results = []
            for index, creator_request in enumerate(requests, start=1):
                name = creator_request["name"] or creator_request["slug"]
                try:
                    result = self.account_admin.import_legacy_claim(creator_request)
                    results.append(result)
                except Exception as error:
                    results.append({
                        "name": name,
                        "slug": creator_request["slug"],
                        "status": "FAILED",
                        "error": str(error),
                    })
                self.after(
                    0,
                    lambda current=index: self.set_status(
                        f"Preparing creator logins... {current} of {len(requests)}",
                        PALETTE["accent"],
                    ),
                )
            self.after(0, lambda: self.show_legacy_claim_results(results))

        threading.Thread(target=work, daemon=True).start()

    def show_legacy_claim_results(self, results):
        self.load_account_admin(silent=True)
        self.legacy_import_button.config(
            state="normal" if self.client and self.creators and self.account_admin else "disabled",
        )
        generated = sum(1 for item in results if item.get("temporaryPassword"))
        claimed = sum(1 for item in results if item.get("status") == "ALREADY_CLAIMED")
        awaiting = sum(1 for item in results if item.get("status") == "AWAITING_CLAIM")
        failed = sum(1 for item in results if item.get("status") == "FAILED")
        self.set_status(
            f"Prepared {generated} creator logins; {awaiting} awaiting claim; "
            f"{claimed} already claimed; {failed} failed.",
            "#46705b" if failed == 0 else PALETTE["accent"],
        )

        window = tk.Toplevel(self)
        window.title("Existing creator claim logins")
        window.transient(self)
        window.geometry("920x520")
        body = ttk.Frame(window, padding=18)
        body.pack(fill="both", expand=True)
        ttk.Label(body, text="Share these one-time login details securely", style="Section.TLabel").pack(anchor="w")
        ttk.Label(
            body,
            text=(
                f"{generated} logins are shown below. The temporary email ending in mankindminds.invalid "
                "is a sign-in identifier only and cannot receive email. Creators must enter an email they control, "
                "verify its code, and set a new password. Passwords are not saved in the staff app or backend."
            ),
            style="Muted.TLabel",
            wraplength=860,
        ).pack(anchor="w", pady=(6, 12))
        table = ttk.Treeview(
            body, columns=("name", "email", "password", "status"), show="headings", selectmode="browse",
        )
        for column, heading, width in (
            ("name", "Creator", 180),
            ("email", "Temporary sign-in email", 300),
            ("password", "One-time password", 210),
            ("status", "Result", 150),
        ):
            table.heading(column, text=heading)
            table.column(column, width=width)
        table_frame = ttk.Frame(body)
        table_frame.pack(fill="both", expand=True)
        scrollbar = ttk.Scrollbar(table_frame, orient="vertical", command=table.yview)
        table.configure(yscrollcommand=scrollbar.set)
        table.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

        def scroll_results(event):
            if getattr(event, "num", None) == 4:
                amount = -1
            elif getattr(event, "num", None) == 5:
                amount = 1
            else:
                delta = getattr(event, "delta", 0)
                amount = -int(delta / 120) if abs(delta) >= 120 else (-1 if delta > 0 else 1)
            table.yview_scroll(amount, "units")
            return "break"

        for widget in (table, table_frame):
            widget.bind("<MouseWheel>", scroll_results)
            widget.bind("<Button-4>", scroll_results)
            widget.bind("<Button-5>", scroll_results)
        table.bind("<Enter>", lambda _event: table.focus_set())

        for index, item in enumerate(results):
            status = {
                "CREATED": "Login created",
                "AWAITING_CLAIM": "Login already issued",
                "ALREADY_CLAIMED": "Already claimed",
                "FAILED": "Failed",
            }.get(item.get("status"), item.get("status", "Unknown"))
            table.insert(
                "", "end", iid=str(index),
                values=(
                    item.get("name", ""),
                    item.get("loginEmail", ""),
                    item.get("temporaryPassword", ""),
                    status if item.get("status") != "FAILED" else f"Failed: {item.get('error', '')}",
                ),
            )

        actions = ttk.Frame(body)
        actions.pack(fill="x", pady=(12, 0))

        def copy_selected():
            selection = table.selection()
            if not selection:
                messagebox.showinfo("Copy creator login", "Select a login row first.", parent=window)
                return
            values = table.item(selection[0], "values")
            if not values[1] or not values[2]:
                messagebox.showinfo("Copy creator login", "This creator has no new login details to copy.", parent=window)
                return
            self.clipboard_clear()
            self.clipboard_append(f"{values[1]}\t{values[2]}")
            self.set_status("Selected temporary login copied to clipboard.", "#46705b")

        def copy_all():
            credentials = [
                f"{item.get('name', '')}\t{item.get('loginEmail', '')}\t{item.get('temporaryPassword', '')}"
                for item in results if item.get("temporaryPassword")
            ]
            if not credentials:
                messagebox.showinfo("Copy creator logins", "No new login details are available to copy.", parent=window)
                return
            self.clipboard_clear()
            self.clipboard_append("Creator\tTemporary sign-in email\tOne-time password\n" + "\n".join(credentials))
            self.set_status("All temporary logins copied to clipboard.", "#46705b")

        ttk.Button(actions, text="Copy selected login", command=copy_selected).pack(side="left")
        ttk.Button(actions, text="Copy all generated logins", command=copy_all).pack(side="left", padx=(8, 0))
        ttk.Button(actions, text="Close", command=window.destroy).pack(side="right")

    def account_admin_action(self, title, action, success_message, on_success=None):
        if not self.account_admin:
            messagebox.showerror(title, "Sign in with an authorized staff GitHub account first.")
            return
        self.set_status(title + "...", PALETTE["accent"])

        def work():
            try:
                action()
                self.after(0, lambda: self.load_account_admin(silent=True))
                self.after(0, lambda: self.set_status(success_message, "#46705b"))
                if on_success:
                    self.after(0, on_success)
            except Exception as error:
                detail = str(error).strip() or repr(error) or "The account service returned an unspecified error."
                self.after(0, lambda: self.set_status(f"{title} failed.", PALETTE["accent"]))
                self.after(0, lambda: messagebox.showerror(
                    f"{title} failed",
                    f"The creator's status was not confirmed.\n\n{detail}",
                ))

        threading.Thread(target=work, daemon=True).start()

    def edit_selected_account(self):
        account = self.selected_account()
        if not account:
            return
        fields = (
            ("email", "Email address"),
            ("displayName", "Display name"),
            ("category", "Category"),
            ("businessName", "Business name"),
            ("businessContactName", "Business contact"),
            ("businessEmail", "Business email"),
        )
        window = tk.Toplevel(self)
        window.title("Edit member account")
        window.transient(self)
        window.grab_set()
        entries = {}
        for row, (key, label) in enumerate(fields):
            ttk.Label(window, text=label).grid(row=row, column=0, sticky="w", padx=12, pady=5)
            entry = ttk.Entry(window, width=48)
            entry.insert(0, account.get(key, "") or "")
            entry.grid(row=row, column=1, sticky="ew", padx=12, pady=5)
            entries[key] = entry
        legacy_profile = next(
            (
                creator for creator in self.creators
                if creator.get("slug") == account.get("legacyCreatorSlug")
            ),
            {},
        )
        sections = legacy_profile.get("sections", [])
        legacy_about = next(
            (section.get("content", "") for section in sections
             if section.get("title", "").lower().startswith("about ")),
            "",
        )
        description_value = account.get("description")
        bio_value = account.get("bio", "")
        if not description_value and legacy_profile:
            description_value = legacy_profile.get("bio") or legacy_profile.get("description", "")
            bio_value = legacy_about or bio_value
        description_row = len(fields)
        ttk.Label(window, text="Description", style="Muted.TLabel").grid(
            row=description_row, column=0, sticky="nw", padx=12, pady=5,
        )
        description = tk.Text(window, width=54, height=4, wrap="word")
        description.insert("1.0", description_value or "")
        description.grid(row=description_row, column=1, sticky="ew", padx=12, pady=5)
        bio_row = description_row + 1
        ttk.Label(window, text="Bio / About work", style="Muted.TLabel").grid(
            row=bio_row, column=0, sticky="nw", padx=12, pady=5,
        )
        bio = tk.Text(window, width=54, height=6, wrap="word")
        bio.insert("1.0", bio_value or "")
        bio.grid(row=bio_row, column=1, sticky="ew", padx=12, pady=5)

        social_row = bio_row + 1
        ttk.Label(window, text="Social links", style="Muted.TLabel").grid(
            row=social_row, column=0, sticky="nw", padx=12, pady=5,
        )
        social_frame = ttk.Frame(window)
        social_frame.grid(row=social_row, column=1, sticky="ew", padx=12, pady=5)
        social_frame.columnconfigure(1, weight=1)
        social_rows = []

        def add_social_row(link=None):
            row = len(social_rows)
            row_frame = ttk.Frame(social_frame)
            row_frame.grid(row=row, column=0, columnspan=3, sticky="ew", pady=3)
            name = ttk.Entry(row_frame, width=20)
            name.insert(0, (link or {}).get("name", ""))
            name.grid(row=0, column=0, padx=(0, 6))
            url = ttk.Entry(row_frame)
            url.insert(0, (link or {}).get("url", ""))
            url.grid(row=0, column=1, sticky="ew")
            row_frame.columnconfigure(1, weight=1)
            row_data = {"frame": row_frame, "name": name, "url": url}
            social_rows.append(row_data)

            def remove_row():
                social_rows.remove(row_data)
                row_frame.destroy()
                for index, item in enumerate(social_rows):
                    item["frame"].grid_configure(row=index)

            ttk.Button(row_frame, text="Remove", command=remove_row).grid(row=0, column=2, padx=(6, 0))

        account_links = account.get("socialLinks")
        if account_links is None and legacy_profile:
            account_links = legacy_profile.get("socialLinks", [])
        if account_links is None:
            account_links = [{
                "name": account.get("socialPlatform", ""),
                "url": account.get("socialHandle", ""),
            }]
        for link in account_links:
            add_social_row(link)
        ttk.Button(
            social_frame, text="+ Add social link", command=lambda: add_social_row(),
        ).grid(row=len(social_rows), column=0, sticky="w", pady=(4, 0))
        window.columnconfigure(1, weight=1)

        def save():
            profile = {key: entry.get().strip() for key, entry in entries.items()}
            profile["description"] = description.get("1.0", "end-1c").strip()
            profile["bio"] = bio.get("1.0", "end-1c").strip()
            profile["socialLinks"] = []
            for item in social_rows:
                name = item["name"].get().strip()
                url = item["url"].get().strip()
                if name or url:
                    if not name or not url:
                        messagebox.showerror(
                            "Incomplete social link",
                            "Provide both a platform name and link, or remove the blank row.",
                            parent=window,
                        )
                        return
                    profile["socialLinks"].append({"name": name, "url": url})
            first_social = profile["socialLinks"][0] if profile["socialLinks"] else {
                "name": "Other", "url": "",
            }
            profile["socialPlatform"] = first_social["name"]
            profile["socialHandle"] = first_social["url"]
            self.account_admin_action(
                "Edit member account",
                lambda: self.account_admin.update_profile(account["id"], profile),
                "Member account updated.",
            )
            window.destroy()

        ttk.Button(window, text="Save account", command=save).grid(
            row=social_row + 1, column=1, sticky="e", padx=12, pady=12,
        )

    def upload_selected_account_photo(self, kind):
        account = self.selected_account()
        if not account:
            return
        file_path = filedialog.askopenfilename(
            title="Choose member photo",
            filetypes=(("Images", "*.jpg *.jpeg *.png *.webp"), ("All files", "*.*")),
        )
        if not file_path:
            return
        self.account_admin_action(
            "Upload member photo",
            lambda: self.account_admin.upload_image(account["id"], file_path, kind),
            "Member photo uploaded.",
        )

    def delete_selected_account_photo(self):
        account = self.selected_account()
        selection = self.account_photo_tree.selection()
        if not account or not selection:
            return
        image_id = selection[0]
        if not messagebox.askyesno("Delete member photo", "Permanently remove this profile or gallery photo?"):
            return
        self.account_admin_action(
            "Delete member photo",
            lambda: self.account_admin.delete_image(account["id"], image_id),
            "Member photo deleted.",
        )

    def reset_selected_account_password(self):
        account = self.selected_account()
        if not account:
            return
        if not messagebox.askyesno(
            "Send password reset",
            f"Send a password-reset link to {account.get('email', 'this account')}?",
        ):
            return
        self.account_admin_action(
            "Send password reset",
            lambda: self.account_admin.reset_password(account["id"]),
            "Password reset email sent.",
        )

    def issue_selected_claim_credentials(self):
        account = self.selected_account()
        if not account:
            return
        if not messagebox.askyesno(
            "Issue temporary claim login",
            f"Issue a one-time login for {account.get('displayName', 'this creator')}? "
            "Any existing sessions will be restricted until the creator claims the account with a verified email and new password.",
        ):
            return
        self.set_status("Issuing temporary login details...", PALETTE["accent"])

        def work():
            try:
                credentials = self.account_admin.issue_claim_credentials(account["id"])
                self.after(0, lambda: self.show_claim_credentials(account, credentials))
                self.after(0, lambda: self.load_account_admin(silent=True))
                self.after(0, lambda: self.set_status("Temporary claim login issued. Share it with the creator securely.", "#46705b"))
            except Exception as error:
                self.after(0, lambda: messagebox.showerror("Could not issue claim login", str(error)))
                self.after(0, lambda: self.set_status("Temporary claim login could not be issued.", PALETTE["accent"]))

        threading.Thread(target=work, daemon=True).start()

    def show_claim_credentials(self, account, credentials):
        window = tk.Toplevel(self)
        window.title("One-time creator login")
        window.transient(self)
        window.grab_set()
        body = ttk.Frame(window, padding=22)
        body.pack(fill="both", expand=True)
        ttk.Label(body, text="Share these details securely", style="Section.TLabel").pack(anchor="w")
        ttk.Label(
            body,
            text=f"One-time details for {account.get('displayName', 'the creator')}. "
                 "This password is shown once and cannot be retrieved later.",
            style="Muted.TLabel",
            wraplength=480,
        ).pack(anchor="w", pady=(6, 16))
        for label, key in (("Temporary username", "username"), ("Temporary password", "temporaryPassword")):
            row = ttk.Frame(body)
            row.pack(fill="x", pady=5)
            ttk.Label(row, text=label, width=20).pack(side="left")
            value = ttk.Entry(row, width=36)
            value.insert(0, credentials[key])
            value.config(state="readonly")
            value.pack(side="left", fill="x", expand=True)
            ttk.Button(
                row, text="Copy",
                command=lambda text=credentials[key]: (self.clipboard_clear(), self.clipboard_append(text)),
            ).pack(side="left", padx=(8, 0))
        ttk.Label(
            body,
            text="After sign-in, the creator must verify an email address they control and choose a new password. "
                 "Their profile stays hidden from the public until that claim is complete.",
            style="Muted.TLabel",
            wraplength=480,
        ).pack(anchor="w", pady=(12, 0))
        ttk.Button(body, text="Close", command=window.destroy).pack(anchor="e", pady=(16, 0))

    def delete_selected_account(self):
        account = self.selected_account()
        self.delete_account_record(account)

    def add_account_ban(self):
        if not self.account_admin:
            messagebox.showerror("Manage bans", "Sign in with an authorized staff GitHub account first.")
            return
        value = self.ban_value.get().strip()
        if not value or value == "Email address or IP address":
            messagebox.showerror("Add ban", "Enter an email address or IP address.")
            return
        self.account_admin_action(
            "Add ban",
            lambda: self.account_admin.add_ban(self.ban_type.get(), value),
            f"{self.ban_type.get().upper()} ban added.",
        )

    def remove_selected_ban(self):
        selection = self.ban_tree.selection()
        if not selection:
            return
        ban_id = selection[0]
        if not messagebox.askyesno("Remove ban", "Allow this email address or IP to use the site again?"):
            return
        self.account_admin_action(
            "Remove ban",
            lambda: self.account_admin.remove_ban(ban_id),
            "Ban removed.",
        )

    def build_form(self):
        for widget in self.form.winfo_children():
            widget.destroy()
        self.fields = {}
        self.add_heading("Creator details", "Sign in, then choose a creator on the left or start a new profile.")
        fields = [
            ("name", "Name", "Creator's public name"),
            ("slug", "Profile slug", "Used in the profile URL"),
        ]
        for key, label, hint in fields:
            self.add_labeled_entry(key, label, hint)
        self.add_labeled_text(
            "description",
            "Description",
            "Shown on creator cards and at the top of the public profile",
            height=4,
        )
        self.add_labeled_text(
            "bio",
            "Bio",
            "Shown in the About section of the public profile",
            height=6,
        )
        self.add_labeled_combo("category", "Niche", CREATOR_NICHES)

        self.add_heading("Tattooist details", "Shown on the map's Artists tab. Only used when Niche is Tattooist.")
        for key, label, hint in (
            ("studio", "Studio name", "e.g. Isabella Sala Tattoos"),
            ("location", "Location", "e.g. Italy"),
            ("styles", "Styles (comma-separated)", "e.g. Fine Line, Minimalist"),
            ("rating", "Rating", "e.g. 4.9"),
        ):
            self.add_labeled_entry(key, label, hint)

        self.add_heading("Verification", "Standard Mankind Minds verification is added automatically.")
        ttk.Label(self.form, text="Verified Creator  ·  AI-Free Verification  ·  Proven AI-Free Creator",
                  style="Muted.TLabel").pack(anchor="w", pady=(0, 16))

        self.add_heading("Profile sections", "Add the creator's unique work description. The verification review is standard.")
        self.sections_container = ttk.Frame(self.form, style="Panel.TFrame")
        self.sections_container.pack(fill="x")
        self.add_section_row()
        self.add_section_row()
        ttk.Button(self.form, text="+  Add section", style="Outline.TButton", command=self.add_section_row).pack(anchor="w", pady=(8, 16))

        self.add_heading("Social links", "Add Instagram, websites, email, or any other public link.")
        self.social_container = ttk.Frame(self.form, style="Panel.TFrame")
        self.social_container.pack(fill="x")
        ttk.Button(self.form, text="+  Add social link", style="Outline.TButton", command=self.add_social_row).pack(anchor="w", pady=(8, 16))

        self.add_heading("Photos", "Add a profile photo and optional gallery photos.")
        self.photo_label = ttk.Label(self.form, text="No profile photo selected", style="Muted.TLabel")
        self.photo_label.pack(anchor="w")
        photo_buttons = ttk.Frame(self.form, style="Panel.TFrame")
        photo_buttons.pack(fill="x", pady=(8, 4))
        ttk.Button(photo_buttons, text="Choose profile photo", style="Outline.TButton", command=self.choose_photo).pack(side="left")
        ttk.Button(photo_buttons, text="Add gallery photos", style="Outline.TButton", command=self.choose_gallery).pack(side="left", padx=8)
        self.gallery_label = ttk.Label(self.form, text="No gallery photos selected", style="Muted.TLabel")
        self.gallery_label.pack(anchor="w")

        gallery_frame = ttk.Frame(self.form, style="Panel.TFrame")
        gallery_frame.pack(fill="x", pady=(8, 0))
        self.gallery_tree = ttk.Treeview(
            gallery_frame,
            columns=("photo", "status"),
            show="headings",
            height=6,
            selectmode="browse",
        )
        self.gallery_tree.heading("photo", text="Gallery photo")
        self.gallery_tree.heading("status", text="Status")
        self.gallery_tree.column("photo", width=360)
        self.gallery_tree.column("status", width=150)
        self.gallery_tree.pack(fill="x", expand=True)

        gallery_actions = ttk.Frame(self.form, style="Panel.TFrame")
        gallery_actions.pack(fill="x", pady=(8, 4))
        ttk.Button(
            gallery_actions, text="View selected", style="Outline.TButton",
            command=self.view_selected_gallery
        ).pack(side="left")
        ttk.Button(
            gallery_actions, text="Replace selected", style="Outline.TButton",
            command=self.replace_selected_gallery
        ).pack(side="left", padx=8)
        ttk.Button(
            gallery_actions, text="Delete selected", style="Outline.TButton",
            command=self.delete_selected_gallery
        ).pack(side="left")
        ttk.Label(
            self.form,
            text="Select a photo above to view it, replace it, or remove it. Changes are applied when you publish.",
            style="Muted.TLabel",
        ).pack(anchor="w", pady=(0, 8))

    def add_heading(self, title, subtitle):
        ttk.Label(self.form, text=title, style="Section.TLabel").pack(anchor="w", pady=(12, 2))
        ttk.Label(self.form, text=subtitle, style="Muted.TLabel").pack(anchor="w", pady=(0, 8))

    def add_labeled_entry(self, key, label, hint):
        frame = ttk.Frame(self.form, style="Panel.TFrame")
        frame.pack(fill="x", pady=4)
        ttk.Label(frame, text=label, width=19, anchor="nw").pack(side="left")
        field_frame = ttk.Frame(frame, style="Panel.TFrame")
        field_frame.pack(side="left", fill="x", expand=True)
        widget = ttk.Entry(field_frame)
        widget.pack(fill="x")
        ttk.Label(field_frame, text=hint, style="Muted.TLabel").pack(anchor="w")
        self.fields[key] = widget
        widget.bind("<KeyRelease>", lambda _event: self.update_preview())
        if key == "bio":
            widget.bind("<KeyRelease>", lambda _event: self.sync_bio_field_to_about())
        if key == "name":
            widget.bind("<KeyRelease>", lambda _event: self.update_standard_section_title())

    def add_labeled_text(self, key, label, hint, height):
        frame = ttk.Frame(self.form, style="Panel.TFrame")
        frame.pack(fill="x", pady=4)
        ttk.Label(frame, text=label, width=19, anchor="nw").pack(side="left")
        field_frame = ttk.Frame(frame, style="Panel.TFrame")
        field_frame.pack(side="left", fill="x", expand=True)
        widget = tk.Text(
            field_frame, height=height, wrap="word", undo=True,
            relief="solid", borderwidth=1, padx=8, pady=6,
        )
        widget.pack(fill="x")
        ttk.Label(field_frame, text=hint, style="Muted.TLabel").pack(anchor="w")
        self.fields[key] = widget
        widget.bind("<KeyRelease>", lambda _event: self.update_preview())

    @staticmethod
    def field_value(widget):
        if isinstance(widget, tk.Text):
            return widget.get("1.0", "end-1c").strip()
        return widget.get().strip()

    @staticmethod
    def set_field_value(widget, value):
        if isinstance(widget, tk.Text):
            widget.delete("1.0", tk.END)
            widget.insert("1.0", value or "")
        else:
            widget.delete(0, tk.END)
            widget.insert(0, value or "")

    def sync_bio_field_to_about(self):
        if self.syncing_creator_bio or not self.section_rows or not self.fields.get("bio"):
            self.update_preview()
            return
        self.syncing_creator_bio = True
        about = self.section_rows[0][2]
        about.delete("1.0", tk.END)
        about.insert("1.0", self.field_value(self.fields["bio"]))
        self.syncing_creator_bio = False
        self.update_preview()

    def sync_about_to_bio(self):
        if self.syncing_creator_bio or not self.section_rows or not self.fields.get("bio"):
            self.update_preview()
            return
        self.syncing_creator_bio = True
        self.set_field_value(self.fields["bio"], self.section_rows[0][2].get("1.0", "end-1c").strip())
        self.syncing_creator_bio = False
        self.update_preview()

    def add_labeled_combo(self, key, label, values):
        frame = ttk.Frame(self.form, style="Panel.TFrame")
        frame.pack(fill="x", pady=4)
        ttk.Label(frame, text=label, width=19, anchor="nw").pack(side="left")
        widget = ttk.Combobox(frame, values=values, state="readonly")
        widget.pack(side="left", fill="x", expand=True)
        self.fields[key] = widget
        widget.bind("<<ComboboxSelected>>", lambda _event: self.update_preview())

    def add_section_row(self, value=None):
        value = value or {"title": "", "content": ""}
        row = ttk.Frame(self.sections_container, style="Panel.TFrame", padding=(0, 4))
        row.pack(fill="x")
        title = ttk.Entry(row, width=28)
        title.insert(0, value.get("title", ""))
        title.pack(side="left", fill="x", expand=True, padx=(0, 8))
        content = tk.Text(row, height=3, width=46, wrap="word", bg="#ffffff", fg=PALETTE["ink"], relief="solid", borderwidth=1)
        is_review = len(self.section_rows) == 1
        content.insert("1.0", STANDARD_REVIEW_CONTENT if is_review else value.get("content", ""))
        content.pack(side="left", fill="x", expand=True, padx=(0, 8))
        if is_review:
            content.config(state="disabled", bg="#eeeae3", fg=PALETTE["muted"])
        if len(self.section_rows) >= 2:
            ttk.Button(row, text="Remove", command=lambda: self.remove_row(row, self.section_rows)).pack(side="right")
        self.section_rows.append((row, title, content))
        title.bind("<KeyRelease>", lambda _event: self.update_preview())
        if len(self.section_rows) != 2:
            if len(self.section_rows) == 0:
                content.bind("<KeyRelease>", lambda _event: self.sync_about_to_bio())
            else:
                content.bind("<KeyRelease>", lambda _event: self.update_preview())
        self.update_preview()

    def ensure_standard_sections(self):
        while len(self.section_rows) < 2:
            self.add_section_row()
        name = self.field_value(self.fields["name"]) or "[Name]"
        first_name = name.split()[0]
        first_title = f"About {first_name}'s Work"
        self.section_rows[0][1].delete(0, tk.END)
        self.section_rows[0][1].insert(0, first_title)
        self.section_rows[1][1].delete(0, tk.END)
        self.section_rows[1][1].insert(0, "Verification Review")
        review_content = self.section_rows[1][2]
        review_content.config(state="normal")
        review_content.delete("1.0", tk.END)
        review_content.insert("1.0", STANDARD_REVIEW_CONTENT)
        review_content.config(state="disabled", bg="#eeeae3", fg=PALETTE["muted"])

    def add_social_row(self, value=None):
        value = value or {"name": "", "url": ""}
        row = ttk.Frame(self.social_container, style="Panel.TFrame", padding=(0, 4))
        row.pack(fill="x")
        name = ttk.Entry(row, width=25)
        name.insert(0, value.get("name", ""))
        name.pack(side="left", fill="x", expand=True, padx=(0, 8))
        url = ttk.Entry(row, width=55)
        url.insert(0, value.get("url", ""))
        url.pack(side="left", fill="x", expand=True, padx=(0, 8))
        ttk.Button(row, text="Remove", command=lambda: self.remove_row(row, self.social_rows)).pack(side="right")
        self.social_rows.append((row, name, url))
        name.bind("<KeyRelease>", lambda _event: self.update_preview())
        url.bind("<KeyRelease>", lambda _event: self.update_preview())
        self.update_preview()

    def remove_row(row, collection):
        row.destroy()
        collection[:] = [item for item in collection if item[0] is not row]
        self.update_preview()
        
    def update_standard_section_title(self):
        if not self.section_rows:
            return
        creator_name = self.field_value(self.fields["name"])
        name = creator_name.split()[0] if creator_name else "[Name]"
        self.section_rows[0][1].delete(0, tk.END)
        self.section_rows[0][1].insert(0, f"About {name}'s Work")
        self.update_preview()

    def update_preview(self):
        if not hasattr(self, "preview_text"):
            return
        name = self.field_value(self.fields["name"]) if self.fields.get("name") else "Creator name"
        category = self.field_value(self.fields["category"]) if self.fields.get("category") else ""
        description = self.field_value(self.fields["description"]) if self.fields.get("description") else ""
        bio = self.field_value(self.fields["bio"]) if self.fields.get("bio") else ""
        sections = [
            {"title": title.get().strip(), "content": content.get("1.0", tk.END).strip()}
            for _, title, content in self.section_rows
        ]
        links = [{"name": name.get().strip(), "url": url.get().strip()} for _, name, url in self.social_rows]
        self.preview_text.config(state="normal")
        self.preview_text.delete("1.0", tk.END)
        self.preview_text.insert(tk.END, STANDARD_BADGE.upper() + "\n", "label")
        self.preview_text.insert(tk.END, name + "\n", "title")
        self.preview_text.insert(tk.END, category + "\n\n", "label")
        self.preview_text.insert(tk.END, description + "\n\n" if description else "Short description will appear here.\n\n")
        self.preview_text.insert(tk.END, "AI-FREE VERIFICATION\n", "heading")
        self.preview_text.insert(tk.END, STANDARD_CARD["description"] + "\n")
        self.preview_text.insert(tk.END, STANDARD_CARD["status"] + "\n\n", "label")
        for index, section in enumerate(sections):
            if section["title"] or section["content"]:
                self.preview_text.insert(tk.END, section["title"] + "\n", "heading")
                content = bio if index == 0 and bio else section["content"]
                self.preview_text.insert(tk.END, content + "\n\n")
        if bio and not sections:
            self.preview_text.insert(tk.END, "ABOUT " + name.upper() + "'S WORK\n", "heading")
            self.preview_text.insert(tk.END, bio + "\n\n")
        if links:
            self.preview_text.insert(tk.END, "LINKS\n", "heading")
            for link in links:
                if link["name"] or link["url"]:
                    self.preview_text.insert(tk.END, f"{link['name']}: {link['url']}\n")
        self.preview_text.config(state="disabled")

    def clear_search_placeholder(self, _event):
        if self.search.get() == "Search creators...":
            self.search.delete(0, tk.END)

    def scroll_form(self, event):
        if self.canvas.winfo_exists():
            self.canvas.yview_scroll(int(-event.delta / 120), "units")

    def set_status(self, text, color=None):
        self.status.config(text=text, foreground=color or PALETTE["muted"])

    def set_creator_editor_enabled(self, enabled):
        self.creator_editor_enabled = enabled
        self.set_widget_state(self.form, enabled)
        if self.section_rows:
            self.section_rows[1][2].config(state="disabled", bg="#eeeae3", fg=PALETTE["muted"])
        self.new_creator_button.config(state="normal" if self.client else "disabled")
        self.remove_creator_button.config(state="normal" if enabled and self.selected else "disabled")

    def set_studio_editor_enabled(self, enabled):
        self.studio_editor_enabled = enabled
        for widget in self.studio_editor_widgets:
            widget.config(state="normal" if enabled else "disabled")

    def set_ticket_editor_enabled(self, enabled):
        self.ticket_editor_enabled = enabled
        for widget in self.ticket_editor_widgets:
            widget.config(state="normal" if enabled else "disabled")

    def set_widget_state(self, widget, enabled):
        try:
            widget.config(state="normal" if enabled else "disabled")
        except tk.TclError:
            pass
        for child in widget.winfo_children():
            self.set_widget_state(child, enabled)

    def set_authenticated_controls(self, enabled):
        state = "normal" if enabled else "disabled"
        self.refresh_button.config(state=state)
        self.deploy_button.config(state=state)
        self.publish_button.config(state=state)
        self.new_creator_button.config(state=state)
        self.new_tattoo_creator_button.config(state=state)
        self.new_shop_button.config(state=state)
        self.new_ticket_button.config(state=state)
        if not enabled:
            self.remove_creator_button.config(state="disabled")
            self.set_creator_editor_enabled(False)
            self.set_studio_editor_enabled(False)
            self.set_ticket_editor_enabled(False)

    def sign_in(self):
        self.sign_in_button.config(state="disabled", text="Signing in...")
        self.set_status("Opening GitHub sign-in in your browser...", PALETTE["accent"])
        def work():
            try:
                token, _code = login_device(
                    lambda code: self.after(
                        0,
                        lambda: self.set_status(
                            f"GitHub opened. Enter device code {code}, then approve access.",
                            PALETTE["accent"],
                        ),
                    )
                )
                client = GitHubClient(token)
                user = client.current_user()
                self.client = client
                self.after(0, lambda: self.sign_in_complete(user["login"]))
            except Exception as error:
                self.after(0, lambda: self.sign_in_failed(str(error)))
        threading.Thread(target=work, daemon=True).start()

    def creators_published(self):
        self.set_status("Creator removed from GitHub. Starting deployment...", "#46705b")
        self.deploy_latest(show_success=False)

    def sign_in_complete(self, login):
        self.current_login = login
        self.user_label.config(text=f"Signed in as {login}")
        self.sign_in_button.config(state="normal", text="Signed in")
        self.set_authenticated_controls(True)
        self.set_status("Sign-in successful. Loading creator records...", PALETTE["accent"])
        self.load_users()
        self.load_studios()
        self.load_tickets()
        self.load_account_admin()
        if self.analytics:
            self.load_analytics()

    def sign_in_failed(self, error):
        self.sign_in_button.config(state="normal", text="Sign in with GitHub")
        self.set_authenticated_controls(False)
        self.set_status("Sign-in failed. Please try again.", PALETTE["accent"])
        messagebox.showerror("Sign-in failed", error)

    def auto_refresh(self):
        if self.client:
            # Never replace the in-progress creator editor from GitHub while staff
            # are editing a creator. This used to make unsaved tattooist details
            # disappear during the automatic refresh.
            if not self.creator_editor_enabled:
                self.load_users(silent=True)
            self.load_studios(silent=True)
            self.load_tickets(silent=True)
            if self.analytics:
                self.load_analytics(silent=True)
        self.after(REFRESH_MS, self.auto_refresh)

    def load_users(self, silent=False):
        if not self.client:
            self.set_status("Sign in with GitHub before loading or publishing records.", PALETTE["accent"])
            return
        if not silent:
            self.set_status("Loading creator records from GitHub...", PALETTE["accent"])
        def work():
            try:
                branch = self.client.repository()["default_branch"]
                data_file = self.client.file(DATA_PATH, branch)
                content = base64.b64decode(data_file["content"]).decode("utf-8")
                self.creators = [
                    {
                        **normalize_creator_profile(creator),
                        "category": LEGACY_NICHE_MAP.get(creator.get("category"), creator.get("category", "")),
                    }
                    for creator in json.loads(content)
                ]
                self.after(0, lambda: self.creator_records_loaded_complete(silent))
            except Exception as error:
                self.after(0, lambda: messagebox.showerror("Could not load users", str(error)))
        threading.Thread(target=work, daemon=True).start()

    def creator_records_loaded_complete(self, silent):
        self.creator_records_loaded = True
        self.refresh_list(silent)
        self.refresh_do_it_for_them_state()

    def build_tattoo_creators_panel(self, parent):
        parent.columnconfigure(0, weight=1)
        parent.rowconfigure(1, weight=1)
        ttk.Label(parent, text="Tattoo creators", style="Section.TLabel").grid(row=0, column=0, sticky="w")
        ttk.Label(
            parent,
            text="Every verified tattooist shown in the map's Artists tab. Select one to edit their "
                 "photo, portfolio, and description in the Creators tab, or add a new one below.",
            style="Muted.TLabel",
        ).grid(row=0, column=1, sticky="e")
        self.tattoo_creator_list = ttk.Treeview(
            parent, columns=("studio", "location"), show="tree headings", selectmode="browse",
        )
        self.tattoo_creator_list.heading("#0", text="Name")
        self.tattoo_creator_list.heading("studio", text="Studio")
        self.tattoo_creator_list.heading("location", text="Location")
        self.tattoo_creator_list.column("#0", width=200)
        self.tattoo_creator_list.grid(row=1, column=0, columnspan=2, sticky="nsew", pady=(12, 0))
        self.tattoo_creator_list.bind("<<TreeviewSelect>>", self.select_tattoo_creator)
        button_row = ttk.Frame(parent, style="Panel.TFrame")
        button_row.grid(row=2, column=0, columnspan=2, sticky="w", pady=(12, 0))
        self.new_tattoo_creator_button = ttk.Button(
            button_row, text="+  New tattoo creator", style="Accent.TButton", command=self.new_tattoo_creator,
        )
        self.new_tattoo_creator_button.pack(side="left")
        ttk.Label(
            button_row,
            text="Opens the Creators tab with their profile photo, portfolio, and description ready to edit.",
            style="Muted.TLabel",
        ).pack(side="left", padx=(12, 0))

    def refresh_tattoo_creator_list(self):
        if not hasattr(self, "tattoo_creator_list"):
            return
        self.tattoo_creator_list.delete(*self.tattoo_creator_list.get_children())
        for index, creator in enumerate(self.tattoo_creators()):
            self.tattoo_creator_list.insert(
                "", "end", iid=str(index), text=creator.get("name", ""),
                values=(creator.get("studio", ""), creator.get("location", "")),
            )

    def tattoo_creators(self):
        return [creator for creator in self.creators if creator.get("category") == "Tattooist"]

    def select_tattoo_creator(self, _event=None):
        selected = self.tattoo_creator_list.selection()
        if not selected:
            return
        creator = self.tattoo_creators()[int(selected[0])]
        self.open_creator_in_editor(creator)

    def open_creator_in_editor(self, creator):
        self.selected = creator
        self.set_creator_editor_enabled(True)
        self.fill_form(creator)
        self.tabs.select(0)
        self.creators_subtabs.select(1)
        for iid in self.user_list.get_children():
            if self.user_list.item(iid, "text") == creator.get("name", ""):
                self.user_list.selection_set(iid)
                break

    def new_tattoo_creator(self):
        if not self.client:
            messagebox.showinfo("Sign in required", "Sign in with GitHub before creating a tattoo creator profile.")
            return
        self.selected = {"slug": "", "name": "", "category": "Tattooist", "sections": [], "socialLinks": [], "gallery": []}
        self.set_creator_editor_enabled(True)
        self.fill_form(self.selected)
        self.tabs.select(0)
        self.creators_subtabs.select(1)
        self.photo_label.config(text="Choose a profile photo before publishing.")
        self.set_status("New tattoo creator profile ready. Add their photo, portfolio, and description.")

    def build_studio_editor(self, parent):
        self.studio_editor_widgets = []
        parent.columnconfigure(1, weight=2)
        parent.columnconfigure(2, weight=1)
        parent.rowconfigure(1, weight=1)
        ttk.Label(parent, text="Tattoo shops on the public map", style="Section.TLabel").grid(row=0, column=0, columnspan=2, sticky="w")
        ttk.Label(parent, text="Sign in, then select a shop or choose + New shop to begin editing.", style="Muted.TLabel").grid(row=0, column=1, sticky="e")
        self.studio_list = ttk.Treeview(parent, columns=("city", "postcode"), show="tree headings", selectmode="browse")
        self.studio_list.heading("#0", text="Studio")
        self.studio_list.heading("city", text="City")
        self.studio_list.heading("postcode", text="Postcode")
        self.studio_list.grid(row=1, column=0, sticky="nsew", padx=(0, 18), pady=(12, 0))
        self.studio_list.bind("<<TreeviewSelect>>", self.select_studio)
        editor = ttk.Frame(parent, style="Panel.TFrame")
        editor.grid(row=1, column=1, sticky="nsew", pady=(12, 0))
        editor.columnconfigure(1, weight=1)
        for row, (key, label) in enumerate((
            ("name", "Studio name"), ("city", "City"), ("hubTitle", "Building / hub"),
            ("postcode", "Postcode"), ("address", "Address"), ("phone", "Phone"),
            ("email", "Email"), ("website", "Website"), ("description", "Description"), ("lat", "Latitude"),
            ("lng", "Longitude"), ("artists", "Artists (comma-separated)"),
        )):
            ttk.Label(editor, text=label).grid(row=row, column=0, sticky="w", padx=(0, 10), pady=5)
            entry = ttk.Entry(editor)
            entry.grid(row=row, column=1, sticky="ew", pady=5)
            entry.bind("<KeyRelease>", lambda _event: self.update_studio_preview())
            self.studio_fields[key] = entry
            self.studio_editor_widgets.append(entry)
        image_row = 13
        ttk.Label(editor, text="Image path").grid(row=image_row, column=0, sticky="w", padx=(0, 10), pady=5)
        self.studio_fields["image"] = ttk.Entry(editor)
        self.studio_fields["image"].grid(row=image_row, column=1, sticky="ew", pady=5)
        self.studio_fields["image"].bind("<KeyRelease>", lambda _event: self.update_studio_preview())
        choose_photo_button = ttk.Button(editor, text="Choose shop photo", command=self.choose_studio_photo)
        choose_photo_button.grid(row=image_row + 1, column=0, pady=8, sticky="w")
        self.studio_editor_widgets.append(choose_photo_button)
        self.studio_photo_label = ttk.Label(editor, text="No new photo selected", style="Muted.TLabel")
        self.studio_photo_label.grid(row=image_row + 1, column=1, sticky="w")
        self.new_shop_button = ttk.Button(editor, text="+ New shop", command=self.new_studio)
        self.new_shop_button.grid(row=image_row + 2, column=0, pady=8, sticky="w")
        save_shop_button = ttk.Button(editor, text="Save shop locally", command=self.save_studio)
        save_shop_button.grid(row=image_row + 2, column=1, pady=8, sticky="w")
        remove_shop_button = ttk.Button(editor, text="Remove selected shop", command=self.remove_selected_studio)
        remove_shop_button.grid(row=image_row + 3, column=0, pady=8, sticky="w")
        publish_shop_button = ttk.Button(editor, text="Publish all shops to GitHub", style="Accent.TButton", command=self.publish_studios)
        publish_shop_button.grid(row=image_row + 4, column=0, columnspan=2, sticky="w")
        self.studio_editor_widgets.extend((self.studio_fields["image"], self.new_shop_button, save_shop_button, remove_shop_button, publish_shop_button))
        preview = ttk.Frame(parent, style="Panel.TFrame", padding=16)
        preview.grid(row=1, column=2, sticky="nsew", padx=(18, 0), pady=(12, 0))
        ttk.Label(preview, text="Map card preview", style="Section.TLabel").pack(anchor="w")
        self.studio_preview = tk.Text(preview, wrap="word", state="disabled", height=20, width=32, bg="#ffffff", fg=PALETTE["ink"], padx=12, pady=12)
        self.studio_preview.pack(fill="both", expand=True, pady=(10, 0))

    def load_studios(self, silent=False):
        if not self.client:
            return
        def work():
            try:
                branch = self.client.repository()["default_branch"]
                data_file = self.client.file(STUDIO_DATA_PATH, branch)
                self.studios = json.loads(base64.b64decode(data_file["content"]).decode("utf-8"))
                self.studio_file_sha = data_file["sha"]
                self.after(0, self.refresh_studio_list)
            except Exception as error:
                if not silent:
                    self.after(0, lambda: messagebox.showerror("Could not load tattoo shops", str(error)))
        threading.Thread(target=work, daemon=True).start()

    def refresh_studio_list(self):
        self.studio_list.delete(*self.studio_list.get_children())
        for index, studio in enumerate(self.studios):
            self.studio_list.insert("", "end", iid=str(index), text=studio.get("name", ""), values=(studio.get("city", ""), studio.get("postcode", "")))

    def select_studio(self, _event=None):
        selected = self.studio_list.selection()
        if selected:
            self.selected_studio = self.studios[int(selected[0])]
            self.set_studio_editor_enabled(True)
            self.fill_studio_form(self.selected_studio)

    def fill_studio_form(self, studio):
        for key, field in self.studio_fields.items():
            value = studio.get(key, "")
            if key == "artists":
                value = ", ".join(studio.get("artists", []))
            field.delete(0, tk.END)
            field.insert(0, str(value))
        self.studio_photo_path = None
        self.studio_photo_label.config(text=f"Current photo: {studio.get('image', 'none')}")
        self.update_studio_preview()

    def new_studio(self):
        if not self.client:
            messagebox.showinfo("Sign in required", "Sign in with GitHub before creating a tattoo shop.")
            return
        self.selected_studio = {"id": max([studio.get("id", 0) for studio in self.studios] or [0]) + 1, "refCode": ""}
        self.set_studio_editor_enabled(True)
        self.fill_studio_form(self.selected_studio)
        self.studio_photo_label.config(text="Choose a photo before publishing (optional).")

    def save_studio(self):
        if not self.selected_studio:
            self.new_studio()
        studio = dict(self.selected_studio)
        for key, field in self.studio_fields.items():
            studio[key] = field.get().strip()
        studio["lat"] = float(studio["lat"])
        studio["lng"] = float(studio["lng"])
        studio["artists"] = [artist.strip() for artist in studio["artists"].split(",") if artist.strip()]
        if not studio.get("refCode"):
            studio["refCode"] = f"MM-{studio['id']:03d}"
        self.studios = [item for item in self.studios if item.get("id") != studio["id"]] + [studio]
        self.studios.sort(key=lambda item: item.get("name", "").lower())
        self.selected_studio = studio
        self.refresh_studio_list()
        self.update_studio_preview()
        self.set_status("Shop saved locally. Publish all shops to make it live.", "#46705b")

    def choose_studio_photo(self):
        self.studio_photo_path = filedialog.askopenfilename(filetypes=[("Images", "*.jpg *.jpeg *.png *.webp")])
        if self.studio_photo_path:
            self.studio_photo_label.config(text=os.path.basename(self.studio_photo_path))

    def update_studio_preview(self):
        if not hasattr(self, "studio_preview"):
            return
        studio = dict(self.selected_studio or {})
        for key, field in self.studio_fields.items():
            studio[key] = field.get().strip()
        artists = [artist.strip() for artist in studio.get("artists", "").split(",") if artist.strip()]
        text = (
            f"{studio.get('name', 'Studio name')}\n"
            f"{studio.get('hubTitle', 'Building / hub')} · {studio.get('city', 'City')}\n"
            f"{studio.get('address', '')} {studio.get('postcode', '')}\n\n"
            f"{studio.get('description', 'Description')}\n\n"
            f"Rating: {studio.get('starRating', '—')} / 5\n"
            f"Artists: {', '.join(artists) if isinstance(artists, list) else artists}\n"
            f"Photo: {studio.get('image', 'none')}"
        )
        self.studio_preview.config(state="normal")
        self.studio_preview.delete("1.0", tk.END)
        self.studio_preview.insert("1.0", text)
        self.studio_preview.config(state="disabled")

    def remove_selected_creator(self):
        if not self.selected:
            messagebox.showinfo("No creator selected", "Select a creator before removing it.")
            return
        if messagebox.askyesno("Remove creator", f"Remove {self.selected.get('name', 'this creator')} from the site?"):
            creator = self.selected
            self.creators = [item for item in self.creators if item.get("slug") != creator.get("slug")]
            self.selected = None
            self.refresh_list()
            self.publish_creators_data()

    def publish_creators_data(self):
        if not self.client:
            return
        def work():
            try:
                branch = self.client.repository()["default_branch"]
                data_file = self.client.file(DATA_PATH, branch)
                for image_url in [self.selected.get("imageUrl", "")] + self.selected.get("gallery", []):
                    self.delete_asset_if_present(image_url, branch, f"Remove assets for {self.selected.get('name', 'creator')}")
                self.client.put_file(DATA_PATH, json.dumps(self.creators, indent=2, ensure_ascii=False).encode(), branch, "Remove creator profile", data_file["sha"])
                self.after(0, self.creators_published)
            except Exception as error:
                self.after(0, lambda: messagebox.showerror("Could not remove creator", str(error)))
        threading.Thread(target=work, daemon=True).start()

    def remove_selected_studio(self):
        if not self.selected_studio:
            messagebox.showinfo("No shop selected", "Select a shop before removing it.")
            return
        if messagebox.askyesno("Remove tattoo shop", f"Remove {self.selected_studio.get('name', 'this shop')} from the map?"):
            self.removed_studio = self.selected_studio
            self.studios = [item for item in self.studios if item.get("id") != self.selected_studio.get("id")]
            self.selected_studio = None
            self.refresh_studio_list()
            self.publish_studios(save_current=False)

    def delete_asset_if_present(self, image_url, branch, message):
        if not image_url:
            return
        asset_path = image_url.lstrip("/")
        try:
            asset_file = self.client.file(asset_path, branch)
            self.client.delete_file(asset_path, branch, message, asset_file["sha"])
        except GitHubError as error:
            if "404" not in str(error):
                raise

    def existing_asset_sha(self, path, branch):
        """Return the current file's sha if it exists, so re-uploads overwrite it
        instead of failing with a 'file already exists' error from GitHub."""
        try:
            return self.client.file(path.lstrip("/"), branch)["sha"]
        except GitHubError as error:
            if "404" in str(error):
                return None
            raise

    def publish_studios(self, save_current=True):
        if not self.client:
            messagebox.showerror("Not signed in", "Sign in with GitHub first.")
            return
        if save_current:
            try:
                self.save_studio()
            except (ValueError, TypeError, KeyError) as error:
                messagebox.showerror("Shop not saved", f"Check the shop fields: {error}")
                return
        def work():
            try:
                branch = self.client.repository()["default_branch"]
                data_file = self.client.file(STUDIO_DATA_PATH, branch)
                studio = self.selected_studio
                removed_studio = getattr(self, "removed_studio", None)
                if not save_current and removed_studio:
                    self.delete_asset_if_present(removed_studio.get("image", ""), branch, f"Remove tattoo shop assets for {removed_studio.get('name', 'shop')}")
                if self.studio_photo_path and studio:
                    extension = os.path.splitext(self.studio_photo_path)[1].lower() or ".jpg"
                    filename = f"{studio['refCode'].lower()}{extension}"
                    with open(self.studio_photo_path, "rb") as photo:
                        self.client.put_file(f"{STUDIO_ASSET_PATH}/{filename}", photo.read(), branch, f"Add tattoo shop photo for {studio['name']}")
                    studio["image"] = f"/assets/studios/{filename}"
                self.client.put_file(STUDIO_DATA_PATH, json.dumps(self.studios, indent=2).encode(), branch, "Update tattoo shop map", data_file["sha"])
                self.studio_photo_path = None
                self.removed_studio = None
                self.after(0, self.studios_published)
            except Exception as error:
                self.after(0, lambda: messagebox.showerror("Could not publish tattoo shops", str(error)))
        threading.Thread(target=work, daemon=True).start()

    def studios_published(self):
        self.set_status("Tattoo shops published to GitHub. Starting deployment...", "#46705b")
        self.deploy_latest(show_success=False)

    def build_do_it_for_them(self, parent):
        parent.columnconfigure(0, weight=1)
        parent.rowconfigure(1, weight=1)
        ttk.Label(
            parent,
            text="Create and publish a creator profile, then email them a temporary login to claim it.",
            style="Muted.TLabel",
            wraplength=1000,
        ).grid(row=0, column=0, sticky="w", pady=(0, 14))

        editor = ttk.Panedwindow(parent, orient="horizontal")
        editor.grid(row=1, column=0, sticky="nsew")
        profile = ttk.Frame(editor, style="Panel.TFrame", padding=(0, 0, 12, 0))
        copy = ttk.Frame(editor, style="Panel.TFrame", padding=(12, 0, 0, 0))
        editor.add(profile, weight=1)
        editor.add(copy, weight=1)
        profile.columnconfigure(1, weight=1)
        copy.columnconfigure(0, weight=1)

        ttk.Label(profile, text="Creator details", style="Section.TLabel").grid(
            row=0, column=0, columnspan=2, sticky="w", pady=(0, 8),
        )
        fields = (
            ("Creator name", "name"),
            ("Profile URL slug", "slug"),
            ("Category", "category"),
            ("Creator email", "email"),
            ("Studio / business", "business"),
            ("Location", "location"),
            ("Tattoo styles (comma-separated)", "styles"),
        )
        self.do_it_fields = {}
        for row, (label, key) in enumerate(fields, start=1):
            ttk.Label(profile, text=label).grid(row=row, column=0, sticky="w", padx=(0, 10), pady=4)
            if key == "category":
                widget = ttk.Combobox(profile, values=CREATOR_NICHES, state="readonly")
            else:
                widget = ttk.Entry(profile)
            widget.grid(row=row, column=1, sticky="ew", pady=4)
            self.do_it_fields[key] = widget

        links_row = len(fields) + 1
        ttk.Label(profile, text="Social / portfolio links", style="Section.TLabel").grid(
            row=links_row, column=0, columnspan=2, sticky="w", pady=(10, 4),
        )
        self.do_it_social_frame = ttk.Frame(profile, style="Panel.TFrame")
        self.do_it_social_frame.grid(row=links_row + 1, column=0, columnspan=2, sticky="ew")
        self.do_it_social_frame.columnconfigure(1, weight=1)
        ttk.Label(self.do_it_social_frame, text="Platform").grid(row=0, column=0, sticky="w", padx=(0, 8))
        ttk.Label(self.do_it_social_frame, text="URL").grid(row=0, column=1, sticky="w")
        self.do_it_add_link_button = ttk.Button(
            profile, text="Add another link", command=self.add_do_it_social_row,
        )
        self.do_it_add_link_button.grid(
            row=links_row + 2, column=0, columnspan=2, sticky="w", pady=(4, 8),
        )
        self.add_do_it_social_row()

        photo_row = links_row + 3
        photo_actions = ttk.Frame(profile, style="Panel.TFrame")
        photo_actions.grid(row=photo_row, column=0, columnspan=2, sticky="ew", pady=(6, 0))
        self.do_it_photo_label = ttk.Label(photo_actions, text="No profile photo selected", style="Muted.TLabel")
        self.do_it_photo_label.pack(side="left", padx=(0, 8))
        self.do_it_photo_button = ttk.Button(
            photo_actions, text="Choose profile photo", command=self.choose_do_it_profile_photo,
        )
        self.do_it_photo_button.pack(side="left")
        gallery_actions = ttk.Frame(profile, style="Panel.TFrame")
        gallery_actions.grid(row=photo_row + 1, column=0, columnspan=2, sticky="ew", pady=(6, 0))
        self.do_it_gallery_label = ttk.Label(gallery_actions, text="No gallery photos selected", style="Muted.TLabel")
        self.do_it_gallery_label.pack(side="left", padx=(0, 8))
        self.do_it_gallery_button = ttk.Button(
            gallery_actions, text="Choose gallery photos", command=self.choose_do_it_gallery_photos,
        )
        self.do_it_gallery_button.pack(side="left")

        ttk.Label(copy, text="Public profile copy", style="Section.TLabel").grid(
            row=0, column=0, sticky="w", pady=(0, 8),
        )
        ttk.Label(copy, text="Description (shown at the top of their public page)").grid(
            row=1, column=0, sticky="w",
        )
        self.do_it_description = tk.Text(
            copy, height=5, wrap="word", bg="#ffffff", fg=PALETTE["ink"], relief="solid", borderwidth=1,
        )
        self.do_it_description.grid(row=2, column=0, sticky="ew", pady=(4, 10))
        ttk.Label(copy, text="Bio (shown in the About section)").grid(row=3, column=0, sticky="w")
        self.do_it_bio = tk.Text(
            copy, height=7, wrap="word", bg="#ffffff", fg=PALETTE["ink"], relief="solid", borderwidth=1,
        )
        self.do_it_bio.grid(row=4, column=0, sticky="ew", pady=(4, 10))
        ttk.Label(
            copy,
            text="After publishing, they receive a one-time username and password by email. They sign in, "
                 "verify this email address, then choose their own password.",
            style="Muted.TLabel",
            wraplength=520,
        ).grid(row=5, column=0, sticky="w", pady=(0, 12))
        actions = ttk.Frame(copy, style="Panel.TFrame")
        actions.grid(row=6, column=0, sticky="w")
        self.do_it_submit_button = ttk.Button(
            actions,
            text="Create profile & email login",
            style="Accent.TButton",
            command=self.submit_do_it_for_them,
            state="disabled",
        )
        self.do_it_submit_button.pack(side="left")
        self.do_it_clear_button = ttk.Button(actions, text="Clear form", command=self.clear_do_it_for_them_form)
        self.do_it_clear_button.pack(
            side="left", padx=(8, 0),
        )
        self.refresh_do_it_for_them_state()

    def refresh_do_it_for_them_state(self, busy=False):
        if not hasattr(self, "do_it_submit_button"):
            return
        if busy:
            state = "disabled"
        else:
            state = (
                "normal"
                if self.client and self.account_admin and self.creator_records_loaded
                else "disabled"
            )
        self.do_it_submit_button.config(
            state=state,
            text="Publishing..." if busy else "Create profile & email login",
        )
        control_state = "disabled" if busy else "normal"
        self.do_it_add_link_button.config(state=control_state)
        self.do_it_photo_button.config(state=control_state)
        self.do_it_gallery_button.config(state=control_state)
        self.do_it_clear_button.config(state=control_state)
        for widget in self.do_it_fields.values():
            widget.config(
                state=("disabled" if busy else "readonly")
                if isinstance(widget, ttk.Combobox)
                else control_state
            )
        for widget in (self.do_it_description, self.do_it_bio):
            widget.config(state=control_state)
        for platform, url in self.do_it_social_rows:
            platform.config(state="disabled" if busy else "readonly")
            url.config(state=control_state)

    def add_do_it_social_row(self):
        if len(self.do_it_social_rows) >= 12:
            messagebox.showinfo("Link limit", "A creator can have up to 12 social or portfolio links.")
            return
        row = len(self.do_it_social_rows) + 1
        platform = ttk.Combobox(
            self.do_it_social_frame,
            values=("Instagram", "TikTok", "YouTube", "Website", "Other"),
            state="readonly",
            width=14,
        )
        platform.set("Instagram")
        platform.grid(row=row, column=0, sticky="ew", padx=(0, 8), pady=2)
        url = ttk.Entry(self.do_it_social_frame)
        url.grid(row=row, column=1, sticky="ew", pady=2)
        self.do_it_social_rows.append((platform, url))

    def choose_do_it_profile_photo(self):
        path = filedialog.askopenfilename(
            filetypes=(("Images", "*.jpg *.jpeg *.png *.webp"), ("All files", "*.*")),
        )
        if path:
            self.do_it_profile_photo = path
            self.do_it_photo_label.config(text=os.path.basename(path))

    def choose_do_it_gallery_photos(self):
        paths = filedialog.askopenfilenames(
            filetypes=(("Images", "*.jpg *.jpeg *.png *.webp"), ("All files", "*.*")),
        )
        if paths:
            self.do_it_gallery_photos.extend(paths)
            self.do_it_gallery_label.config(text=f"{len(self.do_it_gallery_photos)} gallery photos selected")

    def clear_do_it_for_them_form(self):
        for widget in self.do_it_fields.values():
            widget.set("") if isinstance(widget, ttk.Combobox) else widget.delete(0, tk.END)
        self.do_it_description.delete("1.0", tk.END)
        self.do_it_bio.delete("1.0", tk.END)
        for platform, url in self.do_it_social_rows:
            platform.destroy()
            url.destroy()
        self.do_it_social_rows = []
        self.do_it_profile_photo = None
        self.do_it_gallery_photos = []
        self.do_it_photo_label.config(text="No profile photo selected")
        self.do_it_gallery_label.config(text="No gallery photos selected")
        self.add_do_it_social_row()

    def read_do_it_for_them_form(self):
        name = self.do_it_fields["name"].get().strip()
        slug = self.do_it_fields["slug"].get().strip().lower()
        email = self.do_it_fields["email"].get().strip()
        category = self.do_it_fields["category"].get().strip()
        business_name = self.do_it_fields["business"].get().strip()
        location = self.do_it_fields["location"].get().strip()
        styles = [
            style.strip()
            for style in self.do_it_fields["styles"].get().split(",")
            if style.strip()
        ]
        description = self.do_it_description.get("1.0", tk.END).strip()
        bio = self.do_it_bio.get("1.0", tk.END).strip()
        if not name or not category or not email or not description or not bio:
            raise ValueError("Enter the creator name, category, email, description, and bio.")
        if len(name) > 200 or len(description) > 4000 or len(bio) > 4000:
            raise ValueError("Name, description, or bio exceeds the allowed length.")
        if len(business_name) > 200:
            raise ValueError("The studio / business name is too long.")
        if len(email) > 254:
            raise ValueError("The creator email address is too long.")
        if "@" not in email or email.startswith("@") or email.endswith("@"):
            raise ValueError("Enter a valid email address for the creator.")
        if not slug:
            slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
        if not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,119}", slug):
            raise ValueError("The profile URL slug must use lowercase letters, numbers, and hyphens.")
        if category not in CREATOR_NICHES:
            raise ValueError("Select a valid creator category.")

        social_links = []
        for platform, url_entry in self.do_it_social_rows:
            link_name = platform.get().strip()
            link_url = url_entry.get().strip()
            if link_url:
                if len(link_name) > 100 or len(link_url) > 2048:
                    raise ValueError("A social / portfolio link exceeds the allowed length.")
                social_links.append({"name": link_name, "url": link_url})
            elif len(self.do_it_social_rows) == 1:
                continue
            elif link_name != "Instagram":
                raise ValueError("Complete or remove every social / portfolio link.")
        first_link = social_links[0] if social_links else {"name": "Other", "url": ""}
        category_title = name.split()[0]
        creator = {
            "slug": slug,
            "name": name,
            "category": category,
            "description": description,
            "bio": bio,
            "badgeText": STANDARD_BADGE,
            "aiFreeCard": STANDARD_CARD.copy(),
            "sections": [
                {"title": f"About {category_title}'s Work", "content": bio},
                {"title": "Verification Review", "content": STANDARD_REVIEW_CONTENT},
            ],
            "socialLinks": social_links,
            "gallery": [],
            "studio": business_name,
            "location": location,
        }
        if category == "Tattooist":
            creator["styles"] = styles
        return {
            "creator": creator,
            "email": email,
            "businessName": business_name,
            "socialPlatform": first_link["name"] or "Other",
            "socialHandle": first_link["url"],
        }

    def submit_do_it_for_them(self):
        if not self.client or not self.account_admin or not self.creator_records_loaded:
            messagebox.showinfo(
                "Sign in required",
                "Sign in with GitHub and wait for creator records to load before creating a creator account.",
            )
            return
        try:
            request = self.read_do_it_for_them_form()
        except ValueError as error:
            messagebox.showerror("Creator details incomplete", str(error))
            return

        existing = next(
            (item for item in self.creators if item.get("slug") == request["creator"]["slug"]),
            None,
        )
        if existing and (existing.get("name") or "").casefold() != request["creator"]["name"].casefold():
            messagebox.showerror(
                "Profile URL already used",
                f"The profile URL /creators/{request['creator']['slug']} is already used by "
                f"{existing.get('name', 'another creator')}. Choose a different slug.",
            )
            return
        confirmation = (
            f"Update {request['creator']['name']}'s existing public profile and issue fresh temporary login details "
            f"to {request['email']}?"
            if existing else
            f"Publish {request['creator']['name']}'s profile and email a temporary account login to "
            f"{request['email']}? The creator will be added as verified."
        )
        if not messagebox.askyesno("Create creator profile and account", confirmation):
            return
        profile_photo = self.do_it_profile_photo
        gallery_photos = tuple(self.do_it_gallery_photos)
        self.refresh_do_it_for_them_state(busy=True)
        self.set_status("Publishing the creator profile...", PALETTE["accent"])
        client = self.client
        account_admin = self.account_admin
        state = {"profile_published": False, "deployment_started": False}

        def work():
            try:
                existing_accounts = account_admin.accounts()
                if any(
                    str(account.get("email", "")).strip().casefold() == request["email"].casefold()
                    for account in existing_accounts
                ):
                    raise ValueError(
                        "That email address already belongs to an account. Use the existing account instead."
                    )
                claimed_profile = next(
                    (
                        account for account in existing_accounts
                        if request["creator"]["slug"] in (
                            account.get("legacyCreatorSlug"),
                            account.get("creatorSlug"),
                        ) and not account.get("claimRequired")
                    ),
                    None,
                )
                if claimed_profile:
                    raise ValueError(
                        "This creator already claimed their account. Manage it under Creators > Verified accounts."
                    )

                creator = request["creator"]
                repository = client.repository()
                branch = repository["default_branch"]
                data_file = client.file(DATA_PATH, branch)
                creators = json.loads(base64.b64decode(data_file["content"]).decode("utf-8"))
                existing = next((item for item in creators if item.get("slug") == creator["slug"]), None)
                if existing and (existing.get("name") or "").casefold() != creator["name"].casefold():
                    raise ValueError(
                        f"The profile URL /creators/{creator['slug']} is already used by "
                        f"{existing.get('name', 'another creator')}. Choose a different slug."
                    )

                previous_image = existing.get("imageUrl", "") if existing else ""
                creator["imageUrl"] = previous_image
                creator["gallery"] = list(existing.get("gallery", [])) if existing else []
                if profile_photo:
                    extension = os.path.splitext(profile_photo)[1].lower() or ".jpg"
                    filename = f"{creator['slug']}{extension}"
                    asset_path = f"{ASSET_PATH}/{filename}"
                    if previous_image and previous_image.lstrip("/") != asset_path.lstrip("/"):
                        self.delete_asset_if_present(
                            previous_image, branch, f"Replace profile photo for {creator['name']}",
                        )
                    with open(profile_photo, "rb") as photo:
                        client.put_file(
                            asset_path,
                            photo.read(),
                            branch,
                            f"Add profile photo for {creator['name']}",
                            self.existing_asset_sha(asset_path, branch),
                        )
                    creator["imageUrl"] = f"/assets/{filename}"

                for index, path in enumerate(gallery_photos):
                    extension = os.path.splitext(path)[1].lower() or ".jpg"
                    filename = f"{creator['slug']}-gallery-{time.time_ns()}-{index}{extension}"
                    asset_path = f"{ASSET_PATH}/{filename}"
                    with open(path, "rb") as photo:
                        client.put_file(
                            asset_path,
                            photo.read(),
                            branch,
                            f"Add gallery photo for {creator['name']}",
                            self.existing_asset_sha(asset_path, branch),
                        )
                    creator["gallery"].append(f"/assets/{filename}")

                merged = dict(existing or {})
                merged.update(creator)
                if merged.get("category") != "Tattooist":
                    for field in ("styles", "rating"):
                        merged.pop(field, None)
                creators = [item for item in creators if item.get("slug") != creator["slug"]]
                creators.append(merged)
                client.put_file(
                    DATA_PATH,
                    json.dumps(creators, indent=2, ensure_ascii=False).encode("utf-8"),
                    branch,
                    f"Create creator profile: {creator['name']}",
                    data_file["sha"],
                )
                state["profile_published"] = True
                self.after(0, self.clear_do_it_uploaded_media)
                self.creators = [
                    {
                        **normalize_creator_profile(item),
                        "category": LEGACY_NICHE_MAP.get(item.get("category"), item.get("category", "")),
                    }
                    for item in creators
                ]

                client.deployment_workflow(branch)
                client.trigger_deployment()
                state["deployment_started"] = True

                account_payload = {
                    "slug": creator["slug"],
                    "name": creator["name"],
                    "category": ACCOUNT_CATEGORY_MAP[creator["category"]],
                    "socialPlatform": request["socialPlatform"],
                    "socialHandle": request["socialHandle"],
                    "description": creator["description"],
                    "bio": creator["bio"],
                    "businessName": request["businessName"],
                    "socialLinks": creator["socialLinks"],
                }
                account_result = account_admin.create_creator_account(account_payload, request["email"])
                self.after(
                    0,
                    lambda: self.do_it_for_them_complete(
                        creator["name"], request["email"], account_result,
                    ),
                )
            except Exception as error:
                self.after(
                    0,
                    lambda message=str(error): self.do_it_for_them_failed(
                        message, state["profile_published"], state["deployment_started"],
                    ),
                )

        threading.Thread(target=work, daemon=True).start()

    def clear_do_it_uploaded_media(self):
        self.do_it_profile_photo = None
        self.do_it_gallery_photos = []
        self.do_it_photo_label.config(text="No profile photo selected")
        self.do_it_gallery_label.config(text="No gallery photos selected")

    def do_it_for_them_complete(self, creator_name, email, _result):
        self.refresh_list(silent=True)
        self.refresh_do_it_for_them_state()
        self.clear_do_it_for_them_form()
        self.set_status(
            f"{creator_name}'s profile was published and the account setup email was sent to {email}.",
            "#46705b",
        )
        messagebox.showinfo(
            "Creator account set up",
            f"{creator_name}'s profile is published and an email with temporary sign-in details was sent to {email}.\n\n"
            "The creator can sign in at mankindminds.com/account, verify their email, and set a permanent password. "
            "The public profile may take a few minutes to appear while the site update deploys.",
        )

    def do_it_for_them_failed(self, error, profile_published, deployment_started):
        self.refresh_do_it_for_them_state()
        if profile_published:
            messagebox.showerror(
                "Account setup incomplete",
                (
                    "The creator profile was published and the website deployment was started, but the "
                    "account/email step did not complete. "
                    if deployment_started else
                    "The creator profile was published, but the website deployment and account/email steps "
                    "did not complete. "
                )
                + "Review the error before retrying. If the email could not be delivered, retrying will reuse "
                  "the profile URL and issue fresh temporary login details.\n\n"
                + error,
            )
            self.set_status(
                "Profile published; account email was not confirmed. Review the error and retry.",
                PALETTE["accent"],
            )
        else:
            messagebox.showerror("Could not create creator profile", error)
            self.set_status("Creator profile was not published.", PALETTE["accent"])

    def build_analytics_panel(self, parent):
        parent.columnconfigure(0, weight=1)
        parent.columnconfigure(1, weight=1)
        parent.rowconfigure(2, weight=1)
        header = ttk.Frame(parent, style="Panel.TFrame")
        header.grid(row=0, column=0, columnspan=2, sticky="ew")
        ttk.Label(header, text="Live site analytics", style="Section.TLabel").pack(side="left")
        ttk.Label(
            header,
            text="First-party anonymous analytics",
            style="Muted.TLabel",
        ).pack(side="left", padx=(12, 0))
        self.analytics_refresh_button = ttk.Button(header, text="Refresh analytics", command=self.load_analytics)
        self.analytics_refresh_button.pack(side="right")
        self.analytics_summary = tk.Text(
            parent,
            height=8,
            wrap="word",
            state="disabled",
            bg="#ffffff",
            fg=PALETTE["ink"],
            relief="solid",
            borderwidth=1,
            padx=12,
            pady=12,
        )
        self.analytics_summary.grid(row=1, column=0, columnspan=2, sticky="ew", pady=(12, 18))
        self.analytics_pages = self.create_analytics_tree(parent, "Top pages", ("Page", "Visitors", "Views"), 0)
        self.analytics_locations = self.create_analytics_tree(parent, "Visitor locations", ("Location", "Visitors", "Views"), 1)
        self.analytics_dashboard_button = ttk.Button(
            parent,
            text="Open analytics API",
            command=lambda: webbrowser.open(ANALYTICS_API),
        )
        self.analytics_dashboard_button.grid(row=3, column=0, columnspan=2, sticky="w", pady=(14, 0))
        self.write_analytics_message("Sign in with GitHub, then refresh to load analytics.")

    def create_analytics_tree(self, parent, title, columns, column):
        frame = ttk.Frame(parent, style="Panel.TFrame")
        frame.grid(row=2, column=column, sticky="nsew", padx=(0, 10) if column == 0 else (10, 0))
        frame.rowconfigure(1, weight=1)
        frame.columnconfigure(0, weight=1)
        ttk.Label(frame, text=title, style="Section.TLabel").grid(row=0, column=0, sticky="w", pady=(0, 8))
        tree = ttk.Treeview(frame, columns=columns[1:], show="tree headings", height=12)
        tree.heading("#0", text=columns[0])
        tree.column("#0", width=250)
        for name in columns[1:]:
            tree.heading(name, text=name)
            tree.column(name, width=90, anchor="e")
        tree.grid(row=1, column=0, sticky="nsew")
        return tree

    def write_analytics_message(self, message):
        self.analytics_summary.config(state="normal")
        self.analytics_summary.delete("1.0", tk.END)
        self.analytics_summary.insert("1.0", message)
        self.analytics_summary.config(state="disabled")

    def load_analytics(self, silent=False):
        self.analytics_refresh_button.config(state="disabled")
        if not silent:
            self.write_analytics_message("Loading live and historical analytics...")

        def work():
            try:
                summary = self.analytics.aggregate()
                pages = self.analytics.breakdown("pages")
                countries = self.analytics.breakdown("countries")
                cities = self.analytics.breakdown("cities")
                self.after(0, lambda: self.show_analytics(
                    summary,
                    pages,
                    countries,
                    cities,
                ))
            except Exception as error:
                self.after(0, lambda: self.analytics_failed(str(error)))

        threading.Thread(target=work, daemon=True).start()

    def show_analytics(self, summary_data, pages, countries, cities):
        summary = summary_data.get("summary", summary_data)
        bounce_rate = summary.get("bounceRate")
        bounce_text = "Unavailable" if bounce_rate is None else f"{bounce_rate * 100:.1f}%"
        duration = summary.get("averageVisitDurationSeconds")
        duration_text = "Unavailable" if duration is None else f"{duration} seconds"
        summary = (
            f"Currently visiting: {summary.get('activeVisitors', 0)}\n"
            f"Unique visitors (all time): {summary.get('uniqueVisitors', 0)}\n"
            f"Visits (all time): {summary.get('visits', 0)}\n"
            f"Page views (all time): {summary.get('pageviews', 0)}\n"
            f"Bounce rate: {bounce_text}\n"
            f"Average visit duration: {duration_text}"
        )
        self.write_analytics_message(summary)
        self.fill_analytics_tree(self.analytics_pages, pages.get("results", []))
        location_rows = countries.get("results", []) + cities.get("results", [])
        self.fill_analytics_tree(self.analytics_locations, location_rows)
        self.analytics_refresh_button.config(state="normal")
        self.set_status("Analytics refreshed.", "#46705b")

    def fill_analytics_tree(self, tree, rows):
        tree.delete(*tree.get_children())
        for index, row in enumerate(rows):
            metrics = row.get("metrics", {})
            dimensions = row.get("dimensions", [])
            label = dimensions[0] if dimensions else "Unknown"
            tree.insert(
                "",
                "end",
                iid=str(index),
                text=label,
                values=(metrics.get("visitors", 0), metrics.get("pageviews", 0)),
            )

    def analytics_failed(self, error):
        self.analytics_refresh_button.config(state="normal")
        self.write_analytics_message(f"Analytics could not be loaded:\n\n{error}")
        self.set_status("Analytics request failed.", PALETTE["accent"])

    def build_ticket_editor(self, parent):
        self.ticket_editor_widgets = []
        parent.columnconfigure(1, weight=1)
        parent.rowconfigure(1, weight=1)
        ttk.Label(parent, text="Shared staff tickets", style="Section.TLabel").grid(row=0, column=0, columnspan=2, sticky="w")
        ttk.Label(parent, text="Create work items, track priority, and resolve them with staff attribution.", style="Muted.TLabel").grid(row=0, column=1, sticky="e")
        self.ticket_list = ttk.Treeview(parent, columns=("priority", "status", "created"), show="tree headings", selectmode="browse")
        self.ticket_list.heading("#0", text="Ticket")
        self.ticket_list.heading("priority", text="Priority")
        self.ticket_list.heading("status", text="Status")
        self.ticket_list.heading("created", text="Created by")
        self.ticket_list.column("#0", width=260)
        self.ticket_list.grid(row=1, column=0, sticky="nsew", padx=(0, 18), pady=(12, 0))
        self.ticket_list.bind("<<TreeviewSelect>>", self.select_ticket)
        editor = ttk.Frame(parent, style="Panel.TFrame")
        editor.grid(row=1, column=1, sticky="nsew", pady=(12, 0))
        editor.columnconfigure(1, weight=1)
        ttk.Label(editor, text="Title").grid(row=0, column=0, sticky="w", padx=(0, 10), pady=5)
        self.ticket_title = ttk.Entry(editor)
        self.ticket_title.grid(row=0, column=1, sticky="ew", pady=5)
        self.ticket_editor_widgets.append(self.ticket_title)
        ttk.Label(editor, text="Description").grid(row=1, column=0, sticky="nw", padx=(0, 10), pady=5)
        self.ticket_description = tk.Text(editor, height=7, wrap="word", bg="#ffffff", fg=PALETTE["ink"], relief="solid", borderwidth=1)
        self.ticket_description.grid(row=1, column=1, sticky="ew", pady=5)
        self.ticket_editor_widgets.append(self.ticket_description)
        ttk.Label(editor, text="Priority").grid(row=2, column=0, sticky="w", padx=(0, 10), pady=5)
        self.ticket_priority = ttk.Combobox(editor, values=("Low", "Medium", "High", "Urgent"), state="readonly")
        self.ticket_priority.set("Medium")
        self.ticket_priority.grid(row=2, column=1, sticky="w", pady=5)
        self.ticket_editor_widgets.append(self.ticket_priority)
        self.ticket_meta = ttk.Label(editor, text="Sign in, then choose + New ticket or select an existing ticket.", style="Muted.TLabel")
        self.ticket_meta.grid(row=3, column=0, columnspan=2, sticky="w", pady=(10, 5))
        actions = ttk.Frame(editor, style="Panel.TFrame")
        actions.grid(row=4, column=0, columnspan=2, sticky="w", pady=12)
        self.new_ticket_button = ttk.Button(actions, text="+ New ticket", command=self.new_ticket)
        self.new_ticket_button.pack(side="left", padx=(0, 8))
        save_ticket_button = ttk.Button(actions, text="Save ticket", style="Accent.TButton", command=self.save_ticket)
        save_ticket_button.pack(side="left", padx=(0, 8))
        resolve_ticket_button = ttk.Button(actions, text="Resolve selected", command=self.resolve_ticket)
        resolve_ticket_button.pack(side="left")
        self.ticket_editor_widgets.extend((self.new_ticket_button, save_ticket_button, resolve_ticket_button))

    def load_tickets(self, silent=False):
        if not self.client:
            return
        def work():
            try:
                branch = self.client.repository()["default_branch"]
                try:
                    data_file = self.client.file(TICKET_DATA_PATH, branch)
                    self.ticket_file_sha = data_file["sha"]
                    self.tickets = json.loads(base64.b64decode(data_file["content"]).decode("utf-8"))
                except GitHubError as error:
                    if "404" not in str(error):
                        raise
                    self.tickets = []
                    self.ticket_file_sha = None
                self.after(0, self.refresh_ticket_list)
            except Exception as error:
                if not silent:
                    self.after(0, lambda: messagebox.showerror("Could not load tickets", str(error)))
        threading.Thread(target=work, daemon=True).start()

    def refresh_ticket_list(self):
        self.ticket_list.delete(*self.ticket_list.get_children())
        for index, ticket in enumerate(self.tickets):
            self.ticket_list.insert(
                "", "end", iid=str(index), text=ticket.get("title", "Untitled"),
                values=(ticket.get("priority", "Medium"), ticket.get("status", "Open"), ticket.get("createdBy", "")),
            )

    def select_ticket(self, _event=None):
        selected = self.ticket_list.selection()
        if selected:
            self.set_ticket_editor_enabled(True)
            self.selected_ticket = self.tickets[int(selected[0])]
            self.ticket_title.delete(0, tk.END)
            self.ticket_title.insert(0, self.selected_ticket.get("title", ""))
            self.ticket_description.delete("1.0", tk.END)
            self.ticket_description.insert("1.0", self.selected_ticket.get("description", ""))
            self.ticket_priority.set(self.selected_ticket.get("priority", "Medium"))
            resolved = self.selected_ticket.get("resolvedBy")
            self.ticket_meta.config(text=f"Created by {self.selected_ticket.get('createdBy', 'unknown')}"
                + (f" · Resolved by {resolved}" if resolved else " · Open"))

    def new_ticket(self):
        if not self.client:
            messagebox.showinfo("Sign in required", "Sign in with GitHub before creating a shared ticket.")
            return
        self.set_ticket_editor_enabled(True)
        self.selected_ticket = None
        self.ticket_title.delete(0, tk.END)
        self.ticket_description.delete("1.0", tk.END)
        self.ticket_priority.set("Medium")
        self.ticket_meta.config(text=f"New ticket will be created by {self.current_login or 'current staff member'}.")

    def save_ticket(self):
        title = self.ticket_title.get().strip()
        description = self.ticket_description.get("1.0", tk.END).strip()
        if not title or not description:
            messagebox.showerror("Ticket incomplete", "Add a title and description first.")
            return
        ticket = dict(self.selected_ticket or {
            "id": f"ticket-{int(time.time())}",
            "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "createdBy": self.current_login or "staff",
            "status": "Open",
        })
        ticket.update({"title": title, "description": description, "priority": self.ticket_priority.get() or "Medium"})
        if ticket["status"] == "Resolved":
            ticket["status"] = "Open"
            ticket.pop("resolvedBy", None)
            ticket.pop("resolvedAt", None)
        self.tickets = [item for item in self.tickets if item.get("id") != ticket["id"]] + [ticket]
        self.selected_ticket = ticket
        self.publish_tickets("Save staff ticket")

    def resolve_ticket(self):
        if not getattr(self, "selected_ticket", None):
            messagebox.showinfo("No ticket selected", "Select a ticket before resolving it.")
            return
        self.selected_ticket["status"] = "Resolved"
        self.selected_ticket["resolvedBy"] = self.current_login or "staff"
        self.selected_ticket["resolvedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        self.publish_tickets("Resolve staff ticket")

    def publish_tickets(self, message):
        def work():
            try:
                branch = self.client.repository()["default_branch"]
                data_file = None
                try:
                    data_file = self.client.file(TICKET_DATA_PATH, branch)
                except GitHubError as error:
                    if "404" not in str(error):
                        raise
                self.client.put_file(
                    TICKET_DATA_PATH,
                    json.dumps(self.tickets, indent=2).encode("utf-8"),
                    branch,
                    message,
                    data_file["sha"] if data_file else None,
                )
                self.after(0, lambda: self.ticket_publish_complete())
            except Exception as error:
                self.after(0, lambda: messagebox.showerror("Could not save ticket", str(error)))
        threading.Thread(target=work, daemon=True).start()

    def ticket_publish_complete(self):
        self.set_status("Ticket saved to the shared staff list.", "#46705b")
        self.load_tickets(silent=True)

    def refresh_list(self, silent=False):
        query = self.search.get().lower().strip()
        if query == "search creators...":
            query = ""
        self.user_list.delete(*self.user_list.get_children())
        selected_category = self.creator_category.get()
        visible = creator_page_rows(
            self.creators, self.account_rows.values(), selected_category, query,
        )
        all_rows = creator_page_rows(self.creators, self.account_rows.values())
        account_page_count = sum(1 for row in all_rows if row.get("_account_id"))
        account_count = 0
        for index, creator in enumerate(visible):
            is_account = bool(creator.get("_account_id"))
            account_count += is_account
            self.user_list.insert(
                "", "end", iid=str(index),
                text=(
                    f"{creator.get('name', '')} · VERIFIED ACCOUNT"
                    if is_account else f"{creator.get('name', '')} · VERIFIED"
                ),
                values=(creator.get("category", ""),),
            )
        self.count_label.config(
            text=f"{len(visible)} profiles · {account_count} account-backed",
        )
        if hasattr(self, "legacy_import_button"):
            self.legacy_import_button.config(
                state="normal" if self.client and self.creators and self.account_admin else "disabled",
            )
        if hasattr(self, "verified_legacy_count"):
            self.verified_legacy_count.config(
                text=(
                    f"{len(self.creators)} published pages · "
                    f"{account_page_count} additional account profiles"
                ),
            )
        self.refresh_tattoo_creator_list()
        if not silent:
            self.set_status(
                f"{len(visible)} creator profiles shown, including {account_count} Firestore-backed profiles. "
                "Refreshes automatically every minute.",
                "#46705b",
            )

    def select_user(self, _event=None):
        selected = self.user_list.selection()
        if not selected:
            return
        query = self.search.get().lower().strip()
        if query == "search creators...":
            query = ""
        selected_category = self.creator_category.get()
        visible = creator_page_rows(
            self.creators, self.account_rows.values(), selected_category, query,
        )
        creator = visible[int(selected[0])]
        account_id = creator.get("_account_id")
        if account_id:
            self.selected = None
            self.set_creator_editor_enabled(False)
            self.tabs.select(0)
            self.creators_subtabs.select(self.accounts_tab)
            self.account_category.set("All categories")
            self.refresh_approved_account_tree()
            if account_id in self.account_tree.get_children():
                self.account_tree.selection_set(account_id)
                self.account_tree.focus(account_id)
                self.account_tree.see(account_id)
                self.select_account()
            self.set_status(
                f"{creator.get('name', 'Creator')} is Firestore-backed. Edit this profile under Verified accounts.",
                "#46705b",
            )
            return
        self.selected = creator
        self.set_creator_editor_enabled(True)
        self.fill_form(self.selected)

    def fill_form(self, creator):
        for key in ("name", "slug", "description", "bio"):
            self.set_field_value(self.fields[key], creator.get(key, ""))
        category = LEGACY_NICHE_MAP.get(creator.get("category"), creator.get("category", ""))
        self.fields["category"].set(category if category in CREATOR_NICHES else "Artist")
        self.fields["studio"].delete(0, tk.END)
        self.fields["studio"].insert(0, creator.get("studio", ""))
        self.fields["location"].delete(0, tk.END)
        self.fields["location"].insert(0, creator.get("location", ""))
        self.fields["styles"].delete(0, tk.END)
        self.fields["styles"].insert(0, ", ".join(creator.get("styles", []) or []))
        self.fields["rating"].delete(0, tk.END)
        self.fields["rating"].insert(0, creator.get("rating", ""))
        for row, _, _ in self.section_rows:
            row.destroy()
        for row, _, _ in self.social_rows:
            row.destroy()
        self.section_rows = []
        self.social_rows = []
        existing_sections = creator.get("sections", [])
        first_name = creator.get("name", "").strip().split()[0] if creator.get("name", "").strip() else "[Name]"
        defaults = [
            {"title": f"About {first_name}'s Work", "content": ""},
            {"title": "Verification Review", "content": ""},
        ]
        for index, section in enumerate(existing_sections[:2]):
            defaults[index] = {
                "title": defaults[index]["title"],
                "content": section.get("content", ""),
            }
        for section in defaults:
            self.add_section_row(section)
        for section in existing_sections[2:]:
            self.add_section_row(section)
        for link in creator.get("socialLinks", []):
            self.add_social_row(link)
        self.photo_path = None
        self.gallery_paths = []
        self.gallery_replacements = {}
        self.gallery_deleted = []
        self.photo_label.config(text=f"Current profile photo: {creator.get('imageUrl', 'none')}")
        self.refresh_gallery_manager()
        self.canvas.yview_moveto(0)
        self.update_preview()

    def new_user(self):
        if not self.client:
            messagebox.showinfo("Sign in required", "Sign in with GitHub before creating a creator profile.")
            return
        self.selected = {"slug": "", "name": "", "category": "Tattooist", "sections": [], "socialLinks": [], "gallery": []}
        self.set_creator_editor_enabled(True)
        self.fill_form(self.selected)
        self.photo_label.config(text="Choose a profile photo before publishing.")
        self.set_status("New creator profile ready.")

    def choose_photo(self):
        self.photo_path = filedialog.askopenfilename(filetypes=[("Images", "*.jpg *.jpeg *.png *.webp")])
        if self.photo_path:
            self.photo_label.config(text=os.path.basename(self.photo_path))

    def choose_gallery(self):
        paths = list(filedialog.askopenfilenames(filetypes=[("Images", "*.jpg *.jpeg *.png *.webp")]))
        if paths:
            self.gallery_paths.extend(paths)
            self.refresh_gallery_manager()

    def refresh_gallery_manager(self):
        if not self.gallery_tree:
            return
        self.gallery_tree.delete(*self.gallery_tree.get_children())

        existing = list(self.selected.get("gallery", [])) if self.selected else []
        for index, image_url in enumerate(existing):
            status = "Replacement staged" if image_url in self.gallery_replacements else "Published"
            self.gallery_tree.insert(
                "", "end", iid=f"existing:{index}",
                values=(image_url.rsplit("/", 1)[-1], status),
            )

        for index, path in enumerate(self.gallery_paths):
            self.gallery_tree.insert(
                "", "end", iid=f"new:{index}",
                values=(os.path.basename(path), "New / pending"),
            )

        total = len(existing) + len(self.gallery_paths)
        self.gallery_label.config(
            text=f"{total} gallery photos ({len(existing)} published, {len(self.gallery_paths)} pending)"
            if total else "No gallery photos selected"
        )

    def _selected_gallery_item(self):
        if not self.gallery_tree:
            return None
        selection = self.gallery_tree.selection()
        if not selection:
            messagebox.showinfo("No gallery photo selected", "Select a gallery photo first.")
            return None
        kind, raw_index = selection[0].split(":", 1)
        index = int(raw_index)

        if kind == "existing":
            existing = list(self.selected.get("gallery", [])) if self.selected else []
            if index >= len(existing):
                return None
            return kind, index, existing[index]

        if index >= len(self.gallery_paths):
            return None
        return kind, index, self.gallery_paths[index]

    def view_selected_gallery(self):
        item = self._selected_gallery_item()
        if not item:
            return
        kind, _index, value = item
        try:
            if kind == "new":
                webbrowser.open(
                    urllib.parse.urljoin(
                        "file:",
                        urllib.request.pathname2url(os.path.abspath(value)),
                    )
                )
                return

            branch = self.client.repository()["default_branch"] if self.client else "main"
            asset_path = value.lstrip("/")
            url = (
                f"https://github.com/{OWNER}/{REPO}/blob/"
                f"{urllib.parse.quote(branch, safe='')}/"
                f"{urllib.parse.quote(asset_path, safe='/')}"
            )
            webbrowser.open(url)
        except Exception as error:
            messagebox.showerror("Could not view gallery photo", str(error))

    def replace_selected_gallery(self):
        item = self._selected_gallery_item()
        if not item:
            return
        kind, index, value = item
        replacement = filedialog.askopenfilename(
            filetypes=[("Images", "*.jpg *.jpeg *.png *.webp")]
        )
        if not replacement:
            return

        if kind == "existing":
            self.gallery_replacements[value] = replacement
        else:
            self.gallery_paths[index] = replacement

        self.refresh_gallery_manager()
        self.set_status(
            "Gallery photo replacement staged. Publish to make it live.",
            PALETTE["accent"],
        )

    def delete_selected_gallery(self):
        item = self._selected_gallery_item()
        if not item:
            return
        kind, index, value = item

        if kind == "existing":
            name = value.rsplit("/", 1)[-1]
            if not messagebox.askyesno(
                "Delete gallery photo",
                f"Remove {name} from this creator's gallery? The uploaded asset will be deleted when you publish.",
            ):
                return

            existing = list(self.selected.get("gallery", []))
            existing.pop(index)
            self.selected["gallery"] = existing
            self.gallery_deleted.append(value)
            self.gallery_replacements.pop(value, None)
        else:
            self.gallery_paths.pop(index)

        self.refresh_gallery_manager()
        self.set_status(
            "Gallery photo removed from the pending changes. Publish to apply it.",
            PALETTE["accent"],
        )

    def read_form(self):
        self.ensure_standard_sections()
        sections = [{"title": title.get().strip(), "content": content.get("1.0", tk.END).strip()} for _, title, content in self.section_rows]
        links = [{"name": name.get().strip(), "url": url.get().strip()} for _, name, url in self.social_rows]
        if len(sections) < 2:
            raise ValueError("The standard About Work and Verification Review sections are required.")
        creator_name = self.field_value(self.fields["name"])
        first_name = creator_name.split()[0] if creator_name else "[Name]"
        sections[0]["title"] = f"About {first_name}'s Work"
        sections[1]["title"] = "Verification Review"
        sections[1]["content"] = STANDARD_REVIEW_CONTENT
        if any(not item["title"] or not item["content"] for item in sections):
            raise ValueError("Complete or remove every profile section.")
        if any(not item["name"] or not item["url"] for item in links):
            raise ValueError("Complete or remove every social link.")
        # Preserve the complete existing record and update only fields managed by
        # this editor. Rebuilding the dict from the form alone could silently drop
        # tattooist metadata (or any newer backend fields) when publishing.
        creator = dict(self.selected or {})
        creator.update({key: self.field_value(widget) for key, widget in self.fields.items()})
        creator["bio"] = sections[0]["content"]

        is_tattooist = creator.get("category") == "Tattooist"
        styles_raw = creator.pop("styles", "")
        if is_tattooist:
            creator["styles"] = [style.strip() for style in styles_raw.split(",") if style.strip()]
        else:
            # Category changes away from Tattooist are an intentional removal of
            # tattooist-only fields.
            creator.pop("studio", None)
            creator.pop("location", None)
            creator.pop("rating", None)

        creator["badgeText"] = STANDARD_BADGE
        creator["aiFreeCard"] = STANDARD_CARD.copy()
        creator["sections"] = sections
        creator["socialLinks"] = links
        creator["imageUrl"] = self.selected.get("imageUrl", "") if self.selected else ""
        creator["gallery"] = list(self.selected.get("gallery", [])) if self.selected else []
        if not creator["name"] or not creator["category"]:
            raise ValueError("Name and category are required.")
        if not creator["slug"]:
            creator["slug"] = "-".join(creator["name"].lower().split())
        return creator

    def save_draft(self):
        try:
            creator = self.read_form()
            os.makedirs(os.path.dirname(DRAFT_PATH), exist_ok=True)
            with open(DRAFT_PATH, "w", encoding="utf-8") as draft:
                json.dump(creator, draft, indent=2, ensure_ascii=False)
            self.set_status("Draft saved locally. It has not been submitted.", "#46705b")
        except ValueError as error:
            messagebox.showerror("Draft not saved", str(error))

    def load_draft(self):
        if not os.path.exists(DRAFT_PATH):
            messagebox.showinfo("No draft found", "There is no saved local draft yet.")
            return
        try:
            with open(DRAFT_PATH, "r", encoding="utf-8") as draft:
                creator = json.load(draft)
            self.selected = creator
            self.set_creator_editor_enabled(True)
            self.fill_form(creator)
            self.set_status("Draft loaded locally. Review it before publishing.")
        except (OSError, json.JSONDecodeError) as error:
            messagebox.showerror("Draft could not be loaded", str(error))

    def publish(self):
        if not self.client:
            messagebox.showerror("Not signed in", "Sign in with GitHub first.")
            return
        try:
            creator = self.read_form()
        except ValueError as error:
            messagebox.showerror("Check the form", str(error))
            return
        self.publish_button.config(state="disabled", text="Publishing...")
        self.set_status("Publishing directly to the live backend repository...", PALETTE["accent"])
        def work():
            try:
                repo = self.client.repository()
                base = repo["default_branch"]
                previous_image_url = self.selected.get("imageUrl", "") if self.selected else ""
                if self.photo_path:
                    extension = os.path.splitext(self.photo_path)[1].lower() or ".jpg"
                    filename = creator["slug"] + extension
                    new_image_path = f"{ASSET_PATH}/{filename}"
                    if previous_image_url and previous_image_url.lstrip("/") != new_image_path.lstrip("/"):
                        # Extension changed (or slug changed) - remove the old file so it
                        # doesn't linger unused once the new one overwrites/replaces it.
                        self.delete_asset_if_present(previous_image_url, base, f"Replace profile photo for {creator['name']}")
                    with open(self.photo_path, "rb") as photo:
                        self.client.put_file(
                            new_image_path,
                            photo.read(),
                            base,
                            f"Update profile photo for {creator['name']}",
                            self.existing_asset_sha(new_image_path, base),
                        )
                    creator["imageUrl"] = f"/assets/{filename}"
                for image_url, replacement_path in self.gallery_replacements.items():
                    gallery_path = image_url.lstrip("/")
                    with open(replacement_path, "rb") as photo:
                        self.client.put_file(
                            gallery_path,
                            photo.read(),
                            base,
                            f"Replace gallery photo for {creator['name']}",
                            self.existing_asset_sha(gallery_path, base),
                        )

                for image_url in self.gallery_deleted:
                    self.delete_asset_if_present(
                        image_url,
                        base,
                        f"Delete gallery photo for {creator['name']}",
                    )

                for path in self.gallery_paths:
                    extension = os.path.splitext(path)[1].lower() or ".jpg"
                    filename = f"{creator['slug']}-gallery-{int(time.time() * 1000)}{extension}"
                    gallery_path = f"{ASSET_PATH}/{filename}"
                    with open(path, "rb") as photo:
                        self.client.put_file(
                            gallery_path,
                            photo.read(),
                            base,
                            f"Add gallery photo for {creator['name']}",
                            self.existing_asset_sha(gallery_path, base),
                        )
                    creator["gallery"].append(f"/assets/{filename}")

                data_file = self.client.file(DATA_PATH, base)
                creators = json.loads(base64.b64decode(data_file["content"]).decode("utf-8"))

                # Merge into the latest GitHub record instead of replacing it with
                # only the fields currently represented by the editor.
                # This is especially important for tattooist details.
                merged = None
                for item in creators:
                    if item.get("slug") == creator["slug"]:
                        merged = dict(item)
                        merged.update(creator)
                        break

                if merged is None:
                    merged = creator

                creators = [item for item in creators if item.get("slug") != creator["slug"]]
                creators.append(merged)

                self.client.put_file(
                    DATA_PATH,
                    json.dumps(creators, indent=2, ensure_ascii=False).encode("utf-8"),
                    base,
                    f"Update creator profile: {creator['name']}",
                    data_file["sha"],
                )

                # Keep the in-memory creator list in sync with GitHub immediately.
                # New profiles used to be written successfully, but self.creators was
                # not updated, so the new tattooist disappeared from the editor/list
                # until a full reload (and could not be selected for gallery editing).
                self.creators = [item for item in creators]
                self.selected = merged
                self.after(0, self.publish_complete)
            except Exception as error:
                self.after(0, lambda: self.publish_failed(str(error)))
        threading.Thread(target=work, daemon=True).start()

    def publish_complete(self):
        # Refresh the local creator/tattooist lists without reloading from GitHub.
        # This keeps a newly-created profile selectable immediately after publishing.
        self.refresh_list(silent=True)
        self.gallery_paths = []
        self.gallery_replacements = {}
        self.gallery_deleted = []
        self.refresh_gallery_manager()
        self.publish_button.config(state="disabled", text="Deploying...")
        self.set_status("Published to GitHub. Starting the backend deployment...", "#46705b")
        self.deploy_latest(show_success=False)

    def deploy_latest(self, show_success=True):
        if not self.client:
            messagebox.showerror("Not signed in", "Sign in with GitHub first.")
            return
        self.deploy_button.config(state="disabled", text="Starting deployment...")
        self.set_status("Starting a backend deployment from the latest GitHub changes...", PALETTE["accent"])

        def work():
            try:
                repository = self.client.repository()
                try:
                    self.client.deployment_workflow(repository["default_branch"])
                except GitHubError as error:
                    raise GitHubError(
                        "The backend deployment workflow is not installed on the repository's "
                        "default branch. Ask an administrator to add "
                        ".github/workflows/deploy-cloud-run.yml to backend main."
                    ) from error
                self.client.trigger_deployment()
                started_at = time.monotonic()
                run = None
                while time.monotonic() - started_at < 45:
                    runs = self.client.deployment_runs().get("workflow_runs", [])
                    candidates = [
                        item for item in runs
                        if item.get("event") == "repository_dispatch"
                        and item.get("created_at", "") >= time.strftime(
                            "%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() - 50)
                        )
                    ]
                    if candidates:
                        run = candidates[0]
                        break
                    time.sleep(4)
                if not run:
                    raise GitHubError(
                        "GitHub accepted the request but did not start the deployment workflow."
                    )
                self.after(0, lambda: self.deployment_running(show_success))
                while time.monotonic() - started_at < 900:
                    current = self.client.deployment_run(run["id"])
                    if current.get("status") == "completed":
                        if current.get("conclusion") != "success":
                            raise GitHubError(
                                "The deployment workflow failed. Open GitHub Actions for its logs."
                            )
                        self.after(0, self.deployment_complete)
                        return
                    time.sleep(8)
                raise GitHubError("The deployment is still running after 15 minutes.")
            except GitHubError as error:
                self.after(0, lambda: self.deployment_failed(str(error)))

        threading.Thread(target=work, daemon=True).start()

    def deployment_started(self, show_success):
        self.deployment_running(show_success)

    def deployment_running(self, show_success):
        self.deploy_button.config(state="disabled", text="Deploying...")
        self.set_status("Backend deployment is running. Please wait...", PALETTE["accent"])

    def deployment_complete(self):
        self.publish_button.config(state="normal", text="Publish changes to website")
        self.deploy_button.config(state="normal", text="Deploy latest GitHub changes")
        self.set_status("Deployment completed. The latest changes are live.", "#46705b")
        messagebox.showinfo(
            "Deployment complete",
            "The latest GitHub changes were deployed successfully to the website.",
        )

    def deployment_failed(self, error):
        self.publish_button.config(state="normal", text="Publish changes to website")
        self.deploy_button.config(state="normal", text="Deploy latest GitHub changes")
        self.set_status("GitHub updated, but deployment did not complete.", PALETTE["accent"])
        messagebox.showerror(
            "Deployment did not complete",
            "The GitHub changes are safe, but the backend deployment did not complete.\n\n"
            + error,
        )

    def publish_failed(self, error):
        self.publish_button.config(state="normal", text="Publish changes to website")
        self.set_status("Publishing failed. No changes were lost.", PALETTE["accent"])
        messagebox.showerror("Publish failed", error)


if __name__ == "__main__":
    App().mainloop()
