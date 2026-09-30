import re

with open("web/src/app/globals.css", "r") as f:
    content = f.read()

# Update :root
root_updates = {
    "--background": "hsl(142, 84%, 93%)",
    "--secondary-background": "oklch(100% 0 0)",
    "--foreground": "oklch(0% 0 0)",
    "--main-foreground": "oklch(0% 0 0)",
    "--main": "hsl(152, 96%, 45%)",
    "--border": "oklch(0% 0 0)",
    "--ring": "oklch(0% 0 0)",
    "--overlay": "oklch(0% 0 0 / 0.8)",
    "--shadow": "2px 4px 0px 0px var(--border)",
    "--chart-1": "#05E17A",
    "--chart-2": "#FF7A05",
    "--chart-3": "#0099FF",
    "--chart-4": "#FFBF00",
    "--chart-5": "#7A83FF",
    "--chart-active-dot": "#000"
}

for key, val in root_updates.items():
    # Only replace inside :root { ... }
    content = re.sub(r'(:root\s*\{[^}]*)(' + key + r':\s*[^;]+;)', r'\1' + key + ': ' + val + ';', content, count=1)

# Update @theme inline
theme_updates = {
    "--spacing-boxShadowX": "2px",
    "--spacing-boxShadowY": "4px",
    "--spacing-reverseBoxShadowX": "-2px",
    "--spacing-reverseBoxShadowY": "-4px",
    "--radius-base": "10px",
    "--font-weight-base": "500",
    "--font-weight-heading": "900"
}

for key, val in theme_updates.items():
    content = re.sub(r'(@theme inline\s*\{[^}]*)(' + key + r':\s*[^;]+;)', r'\1' + key + ': ' + val + ';', content, count=1)

with open("web/src/app/globals.css", "w") as f:
    f.write(content)
