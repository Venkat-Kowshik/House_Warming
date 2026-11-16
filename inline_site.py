"""Turns the ./site folder into ONE self-contained HTML string.
Streamlit can't serve .html/.css/.js files directly, so CSS, JS and images are embedded."""
import base64, mimetypes, re
from pathlib import Path

def _data_uri(path: Path) -> str:
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()

def build_html(site_dir) -> str:
    site = Path(site_dir)
    html = (site / "index.html").read_text(encoding="utf-8")

    # <link rel="stylesheet" href="styles.css">  ->  <style>...</style>
    def css(m):
        f = site / m.group(1)
        return f"<style>{f.read_text(encoding='utf-8')}</style>" if f.exists() else m.group(0)
    html = re.sub(r'<link rel="stylesheet" href="([^":]+\.css)"\s*/?>', css, html)

    # <script src="x.js"></script>  ->  <script>...</script>
    def js(m):
        f = site / m.group(1)
        return f"<script>{f.read_text(encoding='utf-8').replace('</script>', '<\\/script>')}</script>" if f.exists() else m.group(0)
    html = re.sub(r'<script src="([^":]+\.js)"></script>', js, html)

    # assets/photo.jpg  ->  data:image/jpeg;base64,...   (HTML attributes and CSS url())
    def img(m):
        f = site / m.group(1)
        return _data_uri(f) if f.exists() else m.group(0)
    html = re.sub(r'(assets/[\w\-./]+\.(?:jpg|jpeg|png|webp|gif|svg|mp3))', img, html)
    return html
