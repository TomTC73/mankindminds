"""Mankind Minds staff creator manager.

Run with `python app.py` or package with:
    pyinstaller --onefile --windowed --name MankindMindsStaffManager app.py
"""

import base64
import json
import os
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
import tkinter as tk
from tkinter import filedialog, messagebox, ttk


OWNER = "TomTC73"
REPO = "MankindMindsBackend"
DATA_PATH = "backend/src/main/resources/data/creators.json"
ASSET_PATH = "backend/src/main/resources/static/assets"
API = "https://api.github.com"
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

    def pull_request(self, title, body, branch, base):
        return self.request("POST", f"/repos/{OWNER}/{REPO}/pulls", {
            "title": title,
            "body": body,
            "head": branch,
            "base": base,
        })


def request_json(url, payload):
    request = urllib.request.Request(url, data=urllib.parse.urlencode(payload).encode(), method="POST")
    request.add_header("Accept", "application/json")
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read())


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
        self.creators = []
        self.selected = None
        self.photo_path = None
        self.gallery_paths = []
        self.section_rows = []
        self.social_rows = []
        self.build_styles()
        self.build_ui()
        self.after(REFRESH_MS, self.auto_refresh)

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

        main = ttk.Panedwindow(self, orient="horizontal")
        main.pack(fill="both", expand=True, padx=22, pady=(0, 16))
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
        self.search = ttk.Entry(left)
        self.search.insert(0, "Search creators...")
        self.search.bind("<FocusIn>", self.clear_search_placeholder)
        self.search.bind("<KeyRelease>", lambda _event: self.refresh_list())
        self.search.pack(fill="x", pady=(12, 10))
        self.user_list = ttk.Treeview(left, columns=("category",), show="tree headings", selectmode="browse")
        self.user_list.heading("#0", text="Name")
        self.user_list.heading("category", text="Category")
        self.user_list.column("#0", width=175)
        self.user_list.column("category", width=95)
        self.user_list.pack(fill="both", expand=True)
        self.user_list.bind("<<TreeviewSelect>>", self.select_user)
        ttk.Button(left, text="+  New creator", style="Outline.TButton", command=self.new_user).pack(fill="x", pady=(12, 0))

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

        footer = ttk.Frame(self, padding=(22, 0, 22, 14))
        footer.pack(fill="x")
        self.status = ttk.Label(footer, text="Sign in to load creator records.", style="Status.TLabel")
        self.status.pack(side="left")
        ttk.Button(footer, text="Load draft", command=self.load_draft).pack(side="right", padx=(8, 0))
        ttk.Button(footer, text="Save draft", style="Outline.TButton", command=self.save_draft).pack(side="right", padx=(8, 0))
        ttk.Button(footer, text="Refresh", command=self.load_users).pack(side="right", padx=(8, 0))
        self.publish_button = ttk.Button(footer, text="Publish changes as GitHub PR", style="Accent.TButton", command=self.publish)
        self.publish_button.pack(side="right")

    def build_form(self):
        for widget in self.form.winfo_children():
            widget.destroy()
        self.fields = {}
        self.add_heading("Creator details", "Choose a creator on the left, or start a new profile.")
        fields = [
            ("name", "Name", "Creator's public name"),
            ("slug", "Profile slug", "Used in the profile URL"),
            ("description", "Short description", "Shown on the creator listing"),
            ("bio", "Bio", "The longer profile introduction"),
        ]
        for key, label, hint in fields:
            self.add_labeled_entry(key, label, hint)
        self.add_labeled_combo("category", "Category", ("Tattoos", "Music", "Writing", "Videos", "Art"))

        self.add_heading("Verification", "Standard Mankind Minds verification is added automatically.")
        ttk.Label(self.form, text="Verified Creator  ·  AI-Free Verification  ·  Proven AI-Free Creator",
                  style="Muted.TLabel").pack(anchor="w", pady=(0, 16))

        self.add_heading("Profile sections", "The first two sections are standard. Add optional sections below them.")
        self.sections_container = ttk.Frame(self.form, style="Panel.TFrame")
        self.sections_container.pack(fill="x")
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
        if key == "name":
            widget.bind("<KeyRelease>", lambda _event: self.update_standard_section_title())

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
        content.insert("1.0", value.get("content", ""))
        content.pack(side="left", fill="x", expand=True, padx=(0, 8))
        if len(self.section_rows) >= 2:
            ttk.Button(row, text="Remove", command=lambda: self.remove_row(row, self.section_rows)).pack(side="right")
        self.section_rows.append((row, title, content))
        title.bind("<KeyRelease>", lambda _event: self.update_preview())
        content.bind("<KeyRelease>", lambda _event: self.update_preview())
        self.update_preview()

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
        name = self.fields["name"].get().strip() or "[Name]"
        self.section_rows[0][1].delete(0, tk.END)
        self.section_rows[0][1].insert(0, f"About {name}'s Work")
        self.update_preview()

    def update_preview(self):
        if not hasattr(self, "preview_text"):
            return
        name = self.fields.get("name").get().strip() if self.fields.get("name") else "Creator name"
        category = self.fields.get("category").get().strip() if self.fields.get("category") else ""
        description = self.fields.get("description").get().strip() if self.fields.get("description") else ""
        bio = self.fields.get("bio").get().strip() if self.fields.get("bio") else ""
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
        if bio:
            self.preview_text.insert(tk.END, bio + "\n\n")
        for section in sections:
            if section["title"] or section["content"]:
                self.preview_text.insert(tk.END, section["title"] + "\n", "heading")
                self.preview_text.insert(tk.END, section["content"] + "\n\n")
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

    def sign_in_complete(self, login):
        self.user_label.config(text=f"Signed in as {login}")
        self.sign_in_button.config(state="normal", text="Signed in")
        self.set_status("Sign-in successful. Loading creator records...", PALETTE["accent"])
        self.load_users()

    def sign_in_failed(self, error):
        self.sign_in_button.config(state="normal", text="Sign in with GitHub")
        self.set_status("Sign-in failed. Please try again.", PALETTE["accent"])
        messagebox.showerror("Sign-in failed", error)

    def auto_refresh(self):
        if self.client:
            self.load_users(silent=True)
        self.after(REFRESH_MS, self.auto_refresh)

    def load_users(self, silent=False):
        if not self.client:
            self.set_status("Sign in to load creator records.")
            return
        if not silent:
            self.set_status("Loading creator records from GitHub...", PALETTE["accent"])
        def work():
            try:
                branch = self.client.repository()["default_branch"]
                data_file = self.client.file(DATA_PATH, branch)
                content = base64.b64decode(data_file["content"]).decode("utf-8")
                self.creators = json.loads(content)
                self.after(0, lambda: self.refresh_list(silent))
            except Exception as error:
                self.after(0, lambda: messagebox.showerror("Could not load users", str(error)))
        threading.Thread(target=work, daemon=True).start()

    def refresh_list(self, silent=False):
        query = self.search.get().lower().strip()
        if query == "search creators...":
            query = ""
        self.user_list.delete(*self.user_list.get_children())
        visible = [creator for creator in self.creators if query in creator.get("name", "").lower() or query in creator.get("category", "").lower()]
        for index, creator in enumerate(visible):
            self.user_list.insert("", "end", iid=str(index), text=creator.get("name", ""), values=(creator.get("category", ""),))
        self.count_label.config(text=str(len(self.creators)))
        if not silent:
            self.set_status(f"{len(self.creators)} creator records loaded. Refreshes automatically every minute.", "#46705b")

    def select_user(self, _event=None):
        selected = self.user_list.selection()
        if not selected:
            return
        query = self.search.get().lower().strip()
        if query == "search creators...":
            query = ""
        visible = [creator for creator in self.creators if query in creator.get("name", "").lower() or query in creator.get("category", "").lower()]
        self.selected = visible[int(selected[0])]
        self.fill_form(self.selected)

    def fill_form(self, creator):
        for key in ("name", "slug", "description", "bio"):
            self.fields[key].delete(0, tk.END)
            self.fields[key].insert(0, creator.get(key, ""))
        self.fields["category"].set(creator.get("category", ""))
        for row, _, _ in self.section_rows:
            row.destroy()
        for row, _, _ in self.social_rows:
            row.destroy()
        self.section_rows = []
        self.social_rows = []
        existing_sections = creator.get("sections", [])
        defaults = [
            {"title": f"About {creator.get('name', '').strip() or '[Name]'}'s Work", "content": ""},
            {"title": "Verification Review", "content": ""},
        ]
        for index, section in enumerate(existing_sections[:2]):
            defaults[index] = {
                "title": defaults[index]["title"],
                "content": section.get("content", ""),
            }
        for section in defaults:
            self.add_section_row(section)
        for link in existing_sections[2:]:
            self.add_section_row(link)
        for link in creator.get("socialLinks", []):
            self.add_social_row(link)
        self.photo_path = None
        self.gallery_paths = []
        self.photo_label.config(text=f"Current profile photo: {creator.get('imageUrl', 'none')}")
        self.gallery_label.config(text=f"{len(creator.get('gallery', []))} existing gallery photos")
        self.canvas.yview_moveto(0)
        self.update_preview()

    def new_user(self):
        self.selected = {"slug": "", "name": "", "category": "Tattoos", "sections": [], "socialLinks": [], "gallery": []}
        self.fill_form(self.selected)
        self.photo_label.config(text="Choose a profile photo before publishing.")
        self.set_status("New creator profile ready.")

    def choose_photo(self):
        self.photo_path = filedialog.askopenfilename(filetypes=[("Images", "*.jpg *.jpeg *.png *.webp")])
        if self.photo_path:
            self.photo_label.config(text=os.path.basename(self.photo_path))

    def choose_gallery(self):
        self.gallery_paths = list(filedialog.askopenfilenames(filetypes=[("Images", "*.jpg *.jpeg *.png *.webp")]))
        self.gallery_label.config(text=f"{len(self.gallery_paths)} gallery photos selected")

    def read_form(self):
        sections = [{"title": title.get().strip(), "content": content.get("1.0", tk.END).strip()} for _, title, content in self.section_rows]
        links = [{"name": name.get().strip(), "url": url.get().strip()} for _, name, url in self.social_rows]
        if len(sections) < 2:
            raise ValueError("The standard About Work and Verification Review sections are required.")
        creator_name = self.fields["name"].get().strip()
        sections[0]["title"] = f"About {creator_name or '[Name]'}'s Work"
        sections[1]["title"] = "Verification Review"
        if any(not item["title"] or not item["content"] for item in sections):
            raise ValueError("Complete or remove every profile section.")
        if any(not item["name"] or not item["url"] for item in links):
            raise ValueError("Complete or remove every social link.")
        creator = {key: widget.get().strip() for key, widget in self.fields.items()}
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
        self.set_status("Creating an attributed GitHub branch and pull request...", PALETTE["accent"])
        def work():
            try:
                repo = self.client.repository()
                base = repo["default_branch"]
                branch = f"staff/{creator['slug']}-{int(time.time())}"
                self.client.create_branch(branch, self.client.branch_sha(base))
                if self.photo_path:
                    extension = os.path.splitext(self.photo_path)[1].lower() or ".jpg"
                    filename = creator["slug"] + extension
                    with open(self.photo_path, "rb") as photo:
                        self.client.put_file(f"{ASSET_PATH}/{filename}", photo.read(), branch, f"Add profile photo for {creator['name']}")
                    creator["imageUrl"] = f"/assets/{filename}"
                for index, path in enumerate(self.gallery_paths, start=1):
                    extension = os.path.splitext(path)[1].lower() or ".jpg"
                    filename = f"{creator['slug']}-gallery-{index}{extension}"
                    with open(path, "rb") as photo:
                        self.client.put_file(f"{ASSET_PATH}/{filename}", photo.read(), branch, f"Add gallery photo for {creator['name']}")
                    creator["gallery"].append(f"/assets/{filename}")
                data_file = self.client.file(DATA_PATH, base)
                creators = json.loads(base64.b64decode(data_file["content"]).decode("utf-8"))
                creators = [item for item in creators if item.get("slug") != creator["slug"]]
                creators.append(creator)
                self.client.put_file(DATA_PATH, json.dumps(creators, indent=2, ensure_ascii=False).encode("utf-8"), branch, f"Update creator profile: {creator['name']}", data_file["sha"])
                pr = self.client.pull_request(f"Update creator profile: {creator['name']}", "Submitted through the Mankind Minds staff manager. The GitHub account authoring this pull request identifies the staff member.", branch, base)
                self.after(0, lambda: self.publish_complete(pr["html_url"]))
            except Exception as error:
                self.after(0, lambda: self.publish_failed(str(error)))
        threading.Thread(target=work, daemon=True).start()

    def publish_complete(self, url):
        self.publish_button.config(state="normal", text="Publish changes as GitHub PR")
        self.set_status("Published successfully. Pull request is ready for review.", "#46705b")
        messagebox.showinfo("Published for review", url)

    def publish_failed(self, error):
        self.publish_button.config(state="normal", text="Publish changes as GitHub PR")
        self.set_status("Publishing failed. No changes were lost.", PALETTE["accent"])
        messagebox.showerror("Publish failed", error)


if __name__ == "__main__":
    App().mainloop()
