"""Mankind Minds staff creator manager.

Run with `python app.py`. Package with:
    pyinstaller --onefile --windowed app.py

Set MM_GITHUB_CLIENT_ID to the public client ID of a GitHub OAuth App before
packaging. Staff authenticate individually through GitHub's device login flow.
Every publish creates a named branch and pull request under the signed-in user.
"""

import base64
import json
import os
import threading
import time
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
CLIENT_ID = os.environ.get("MM_GITHUB_CLIENT_ID", "")


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
        return self.request(
            "GET", f"/repos/{OWNER}/{REPO}/contents/{urllib.parse.quote(path, safe='/')}?ref={urllib.parse.quote(ref)}"
        )

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
        return self.request(
            "PUT", f"/repos/{OWNER}/{REPO}/contents/{urllib.parse.quote(path, safe='/')}", payload
        )

    def pull_request(self, title, body, branch, base):
        return self.request("POST", f"/repos/{OWNER}/{REPO}/pulls", {
            "title": title,
            "body": body,
            "head": branch,
            "base": base,
        })


def login_device():
    if not CLIENT_ID:
        raise GitHubError("Set MM_GITHUB_CLIENT_ID before using GitHub sign-in.")
    payload = urllib.parse.urlencode({
        "client_id": CLIENT_ID,
        "scope": "repo",
    }).encode()
    request = urllib.request.Request("https://github.com/login/device/code", data=payload, method="POST")
    request.add_header("Accept", "application/json")
    with urllib.request.urlopen(request, timeout=30) as response:
        device = json.loads(response.read())
    webbrowser.open(device["verification_uri"])
    messagebox.showinfo("GitHub sign-in", f"Enter code {device['user_code']} in your browser.")
    interval = int(device.get("interval", 5))
    while True:
        time.sleep(interval)
        token_request = urllib.request.Request(
            "https://github.com/login/oauth/access_token",
            data=urllib.parse.urlencode({
                "client_id": CLIENT_ID,
                "device_code": device["device_code"],
                "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
            }).encode(),
            method="POST",
        )
        token_request.add_header("Accept", "application/json")
        with urllib.request.urlopen(token_request, timeout=30) as response:
            token = json.loads(response.read())
        if token.get("access_token"):
            return token["access_token"]
        if token.get("error") not in ("authorization_pending", "slow_down"):
            raise GitHubError(token.get("error_description", "GitHub sign-in failed."))
        if token.get("error") == "slow_down":
            interval += 5


class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Mankind Minds Staff Manager")
        self.geometry("1100x760")
        self.client = None
        self.creators = []
        self.selected = None
        self.photo_path = None
        self.gallery_paths = []
        self.build_ui()

    def build_ui(self):
        toolbar = ttk.Frame(self, padding=12)
        toolbar.pack(fill="x")
        self.user_label = ttk.Label(toolbar, text="Not signed in")
        self.user_label.pack(side="left")
        ttk.Button(toolbar, text="Sign in with GitHub", command=self.sign_in).pack(side="right")
        ttk.Button(toolbar, text="Refresh users", command=self.load_users).pack(side="right", padx=8)

        main = ttk.Panedwindow(self, orient="horizontal")
        main.pack(fill="both", expand=True, padx=12, pady=(0, 12))
        left = ttk.Frame(main, padding=8)
        right = ttk.Frame(main, padding=8)
        main.add(left, weight=1)
        main.add(right, weight=3)

        ttk.Label(left, text="Current users").pack(anchor="w")
        self.user_list = tk.Listbox(left, exportselection=False)
        self.user_list.pack(fill="both", expand=True, pady=(6, 0))
        self.user_list.bind("<<ListboxSelect>>", self.select_user)

        self.fields = {}
        form = ttk.Frame(right)
        form.pack(fill="both", expand=True)
        for row, (key, label) in enumerate([
            ("name", "Name"), ("slug", "Slug"), ("category", "Category"),
            ("description", "Short description"), ("badgeText", "Badge"),
            ("bio", "Bio"), ("aiTitle", "Verification title"),
            ("aiDescription", "Verification description"), ("aiStatus", "Verification status"),
        ]):
            ttk.Label(form, text=label).grid(row=row, column=0, sticky="nw", padx=(0, 8), pady=4)
            if key == "category":
                widget = ttk.Combobox(form, values=("Tattoos", "Music", "Writing", "Videos", "Art"), state="readonly")
            else:
                widget = ttk.Entry(form)
            widget.grid(row=row, column=1, sticky="ew", pady=4)
            self.fields[key] = widget
        form.columnconfigure(1, weight=1)

        row = 9
        ttk.Label(form, text="Sections (JSON)").grid(row=row, column=0, sticky="nw", pady=4)
        self.sections = tk.Text(form, height=7, wrap="word")
        self.sections.grid(row=row, column=1, sticky="nsew", pady=4)
        row += 1
        ttk.Label(form, text="Social links (JSON)").grid(row=row, column=0, sticky="nw", pady=4)
        self.social = tk.Text(form, height=5, wrap="word")
        self.social.grid(row=row, column=1, sticky="nsew", pady=4)
        row += 1
        ttk.Label(form, text="Photos").grid(row=row, column=0, sticky="nw", pady=4)
        photo_frame = ttk.Frame(form)
        photo_frame.grid(row=row, column=1, sticky="ew", pady=4)
        self.photo_label = ttk.Label(photo_frame, text="No profile photo selected")
        self.photo_label.pack(anchor="w")
        ttk.Button(photo_frame, text="Choose profile photo", command=self.choose_photo).pack(side="left", pady=4)
        ttk.Button(photo_frame, text="Add gallery photos", command=self.choose_gallery).pack(side="left", padx=8, pady=4)
        self.gallery_label = ttk.Label(photo_frame, text="")
        self.gallery_label.pack(anchor="w")
        form.rowconfigure(9, weight=1)
        form.rowconfigure(10, weight=1)

        buttons = ttk.Frame(right)
        buttons.pack(fill="x", pady=(10, 0))
        ttk.Button(buttons, text="New user", command=self.new_user).pack(side="left")
        ttk.Button(buttons, text="Publish changes as GitHub PR", command=self.publish).pack(side="right")
        self.status = ttk.Label(right, text="Sign in to load users.", foreground="#555")
        self.status.pack(anchor="w", pady=(8, 0))

    def sign_in(self):
        def work():
            try:
                token = login_device()
                self.client = GitHubClient(token)
                user = self.client.current_user()
                self.after(0, lambda: self.user_label.config(text=f"Signed in as {user['login']}"))
                self.load_users()
            except Exception as error:
                self.after(0, lambda: messagebox.showerror("Sign-in failed", str(error)))
        threading.Thread(target=work, daemon=True).start()

    def load_users(self):
        if not self.client:
            return
        def work():
            try:
                branch = self.client.repository()["default_branch"]
                file = self.client.file(DATA_PATH, branch)
                content = base64.b64decode(file["content"]).decode("utf-8")
                self.creators = json.loads(content)
                self.after(0, self.refresh_list)
            except Exception as error:
                self.after(0, lambda: messagebox.showerror("Could not load users", str(error)))
        threading.Thread(target=work, daemon=True).start()

    def refresh_list(self):
        self.user_list.delete(0, tk.END)
        for creator in self.creators:
            self.user_list.insert(tk.END, f"{creator.get('name', '')} - {creator.get('category', '')}")
        self.status.config(text=f"{len(self.creators)} users loaded from GitHub.")

    def select_user(self, _event=None):
        selection = self.user_list.curselection()
        if not selection:
            return
        self.selected = self.creators[selection[0]]
        self.fill_form(self.selected)

    def fill_form(self, creator):
        for key in ("name", "slug", "category", "description", "badgeText", "bio"):
            self.fields[key].delete(0, tk.END)
            self.fields[key].insert(0, creator.get(key, ""))
        card = creator.get("aiFreeCard") or {}
        for key, value in (("aiTitle", card.get("title", "")), ("aiDescription", card.get("description", "")), ("aiStatus", card.get("status", ""))):
            self.fields[key].delete(0, tk.END)
            self.fields[key].insert(0, value)
        self.replace_text(self.sections, creator.get("sections", []))
        self.replace_text(self.social, creator.get("socialLinks", []))
        self.photo_path = None
        self.gallery_paths = []
        self.photo_label.config(text=f"Current: {creator.get('imageUrl', 'none')}")
        self.gallery_label.config(text=f"{len(creator.get('gallery', []))} existing gallery photos")

    @staticmethod
    def replace_text(widget, value):
        widget.delete("1.0", tk.END)
        widget.insert("1.0", json.dumps(value, indent=2, ensure_ascii=False))

    def new_user(self):
        self.selected = {"slug": "", "name": "", "category": "Tattoos", "sections": [], "socialLinks": []}
        self.fill_form(self.selected)
        self.photo_label.config(text="Choose a profile photo before publishing.")

    def choose_photo(self):
        self.photo_path = filedialog.askopenfilename(filetypes=[("Images", "*.jpg *.jpeg *.png *.webp")])
        if self.photo_path:
            self.photo_label.config(text=os.path.basename(self.photo_path))

    def choose_gallery(self):
        self.gallery_paths = list(filedialog.askopenfilenames(filetypes=[("Images", "*.jpg *.jpeg *.png *.webp")]))
        self.gallery_label.config(text=f"{len(self.gallery_paths)} gallery photos selected")

    def read_form(self):
        try:
            sections = json.loads(self.sections.get("1.0", tk.END))
            social = json.loads(self.social.get("1.0", tk.END))
        except json.JSONDecodeError as error:
            raise ValueError(f"Sections and social links must be valid JSON: {error}") from error
        creator = {key: widget.get().strip() for key, widget in self.fields.items() if key not in ("aiTitle", "aiDescription", "aiStatus")}
        creator["aiFreeCard"] = {
            "title": self.fields["aiTitle"].get().strip(),
            "description": self.fields["aiDescription"].get().strip(),
            "status": self.fields["aiStatus"].get().strip(),
        }
        creator["sections"] = sections
        creator["socialLinks"] = social
        creator["imageUrl"] = self.selected.get("imageUrl", "") if self.selected else ""
        creator["gallery"] = list(self.selected.get("gallery", [])) if self.selected else []
        if not creator["name"] or not creator["category"]:
            raise ValueError("Name and category are required.")
        if not creator["slug"]:
            creator["slug"] = "-".join(creator["name"].lower().split())
        return creator

    def publish(self):
        if not self.client:
            messagebox.showerror("Not signed in", "Sign in with GitHub first.")
            return
        try:
            creator = self.read_form()
        except ValueError as error:
            messagebox.showerror("Check the form", str(error))
            return
        def work():
            try:
                repo = self.client.repository()
                base = repo["default_branch"]
                branch = f"staff/{creator['slug']}-{int(time.time())}"
                self.client.create_branch(branch, self.client.branch_sha(base))
                if self.photo_path:
                    extension = os.path.splitext(self.photo_path)[1].lower() or ".jpg"
                    filename = creator["slug"] + extension
                    self.client.put_file(
                        f"{ASSET_PATH}/{filename}", open(self.photo_path, "rb").read(), branch,
                        f"Add profile photo for {creator['name']}",
                    )
                    creator["imageUrl"] = f"/assets/{filename}"
                for index, path in enumerate(self.gallery_paths, start=1):
                    extension = os.path.splitext(path)[1].lower() or ".jpg"
                    filename = f"{creator['slug']}-gallery-{index}{extension}"
                    self.client.put_file(
                        f"{ASSET_PATH}/{filename}", open(path, "rb").read(), branch,
                        f"Add gallery photo for {creator['name']}",
                    )
                    creator["gallery"].append(f"/assets/{filename}")
                data_file = self.client.file(DATA_PATH, base)
                data = base64.b64decode(data_file["content"]).decode("utf-8")
                creators = json.loads(data)
                creators = [item for item in creators if item.get("slug") != creator["slug"]]
                creators.append(creator)
                self.client.put_file(
                    DATA_PATH, json.dumps(creators, indent=2, ensure_ascii=False).encode("utf-8"),
                    branch, f"Update creator profile: {creator['name']}", data_file["sha"],
                )
                pr = self.client.pull_request(
                    f"Update creator profile: {creator['name']}",
                    "Submitted through the Mankind Minds staff manager. "
                    "The GitHub account authoring this pull request identifies the staff member.",
                    branch, base,
                )
                self.after(0, lambda: messagebox.showinfo("Published for review", pr["html_url"]))
            except Exception as error:
                self.after(0, lambda: messagebox.showerror("Publish failed", str(error)))
        threading.Thread(target=work, daemon=True).start()


if __name__ == "__main__":
    App().mainloop()
