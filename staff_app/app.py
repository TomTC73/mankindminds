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
STUDIO_DATA_PATH = "backend/src/main/resources/data/studios.json"
TICKET_DATA_PATH = "backend/staff/tickets.json"
ASSET_PATH = "backend/src/main/resources/static/assets"
STUDIO_ASSET_PATH = ASSET_PATH + "/studios"
API = "https://api.github.com"
DEPLOYMENT_EVENT = "deploy-backend"
DEPLOYMENT_WORKFLOW = ".github/workflows/deploy-cloud-run.yml"
CREATOR_NICHES = ("Tattooist", "Musician", "Writer", "Content Creator", "Artist", "Illustrator", "Photographer")
LEGACY_NICHE_MAP = {
    "Tattoos": "Tattooist",
    "Music": "Musician",
    "Writing": "Writer",
    "Videos": "Content Creator",
    "Art": "Artist",
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
        self.studios = []
        self.selected_studio = None
        self.studio_fields = {}
        self.studio_photo_path = None
        self.current_login = ""
        self.tickets = []
        self.ticket_file_sha = None
        self.section_rows = []
        self.social_rows = []
        self.creator_editor_enabled = False
        self.studio_editor_enabled = False
        self.ticket_editor_enabled = False
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
        main = ttk.Panedwindow(tabs, orient="horizontal")
        tabs.add(main, text="Creators")
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
        shops_tab = ttk.Frame(tabs, style="Panel.TFrame", padding=20)
        tabs.add(shops_tab, text="Tattoo shops")
        self.build_studio_editor(shops_tab)
        self.set_studio_editor_enabled(False)
        tickets_tab = ttk.Frame(tabs, style="Panel.TFrame", padding=20)
        tabs.add(tickets_tab, text="To Do List")
        self.build_ticket_editor(tickets_tab)
        self.set_ticket_editor_enabled(False)

    def build_form(self):
        for widget in self.form.winfo_children():
            widget.destroy()
        self.fields = {}
        self.add_heading("Creator details", "Sign in, then choose a creator on the left or start a new profile.")
        fields = [
            ("name", "Name", "Creator's public name"),
            ("slug", "Profile slug", "Used in the profile URL"),
            ("description", "Short description", "Shown on the creator listing"),
            ("bio", "Bio", "The longer profile introduction"),
        ]
        for key, label, hint in fields:
            self.add_labeled_entry(key, label, hint)
        self.add_labeled_combo("category", "Niche", CREATOR_NICHES)

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
            content.bind("<KeyRelease>", lambda _event: self.update_preview())
        self.update_preview()

    def ensure_standard_sections(self):
        while len(self.section_rows) < 2:
            self.add_section_row()
        name = self.fields["name"].get().strip() or "[Name]"
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
        name = self.fields["name"].get().strip().split()[0] if self.fields["name"].get().strip() else "[Name]"
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
        for index, section in enumerate(sections):
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

    def sign_in_failed(self, error):
        self.sign_in_button.config(state="normal", text="Sign in with GitHub")
        self.set_authenticated_controls(False)
        self.set_status("Sign-in failed. Please try again.", PALETTE["accent"])
        messagebox.showerror("Sign-in failed", error)

    def auto_refresh(self):
        if self.client:
            self.load_users(silent=True)
            self.load_studios(silent=True)
            self.load_tickets(silent=True)
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
                    {**creator, "category": LEGACY_NICHE_MAP.get(creator.get("category"), creator.get("category", ""))}
                    for creator in json.loads(content)
                ]
                self.after(0, lambda: self.refresh_list(silent))
            except Exception as error:
                self.after(0, lambda: messagebox.showerror("Could not load users", str(error)))
        threading.Thread(target=work, daemon=True).start()

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
        self.set_creator_editor_enabled(True)
        self.fill_form(self.selected)

    def fill_form(self, creator):
        for key in ("name", "slug", "description", "bio"):
            self.fields[key].delete(0, tk.END)
            self.fields[key].insert(0, creator.get(key, ""))
        category = LEGACY_NICHE_MAP.get(creator.get("category"), creator.get("category", ""))
        self.fields["category"].set(category if category in CREATOR_NICHES else "Artist")
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
        self.photo_label.config(text=f"Current profile photo: {creator.get('imageUrl', 'none')}")
        self.gallery_label.config(text=f"{len(creator.get('gallery', []))} existing gallery photos")
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
        self.gallery_paths = list(filedialog.askopenfilenames(filetypes=[("Images", "*.jpg *.jpeg *.png *.webp")]))
        self.gallery_label.config(text=f"{len(self.gallery_paths)} gallery photos selected")

    def read_form(self):
        self.ensure_standard_sections()
        sections = [{"title": title.get().strip(), "content": content.get("1.0", tk.END).strip()} for _, title, content in self.section_rows]
        links = [{"name": name.get().strip(), "url": url.get().strip()} for _, name, url in self.social_rows]
        if len(sections) < 2:
            raise ValueError("The standard About Work and Verification Review sections are required.")
        creator_name = self.fields["name"].get().strip()
        first_name = creator_name.split()[0] if creator_name else "[Name]"
        sections[0]["title"] = f"About {first_name}'s Work"
        sections[1]["title"] = "Verification Review"
        sections[1]["content"] = STANDARD_REVIEW_CONTENT
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
                if self.photo_path:
                    extension = os.path.splitext(self.photo_path)[1].lower() or ".jpg"
                    filename = creator["slug"] + extension
                    with open(self.photo_path, "rb") as photo:
                        self.client.put_file(
                            f"{ASSET_PATH}/{filename}",
                            photo.read(),
                            base,
                            f"Add profile photo for {creator['name']}",
                        )
                    creator["imageUrl"] = f"/assets/{filename}"
                for index, path in enumerate(self.gallery_paths, start=1):
                    extension = os.path.splitext(path)[1].lower() or ".jpg"
                    filename = f"{creator['slug']}-gallery-{index}{extension}"
                    with open(path, "rb") as photo:
                        self.client.put_file(
                            f"{ASSET_PATH}/{filename}",
                            photo.read(),
                            base,
                            f"Add gallery photo for {creator['name']}",
                        )
                    creator["gallery"].append(f"/assets/{filename}")
                data_file = self.client.file(DATA_PATH, base)
                creators = json.loads(base64.b64decode(data_file["content"]).decode("utf-8"))
                creators = [item for item in creators if item.get("slug") != creator["slug"]]
                creators.append(creator)
                self.client.put_file(
                    DATA_PATH,
                    json.dumps(creators, indent=2, ensure_ascii=False).encode("utf-8"),
                    base,
                    f"Update creator profile: {creator['name']}",
                    data_file["sha"],
                )
                self.after(0, self.publish_complete)
            except Exception as error:
                self.after(0, lambda: self.publish_failed(str(error)))
        threading.Thread(target=work, daemon=True).start()

    def publish_complete(self):
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
