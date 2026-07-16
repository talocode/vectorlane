#!/usr/bin/env python3
"""Generate VectorLane architecture diagram as PNG."""
from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1200, 800
BG = (28, 28, 28)
WHITE = (255, 255, 255)
CYAN = (88, 196, 221)
GREEN = (131, 193, 103)
YELLOW = (255, 255, 0)
RED = (255, 107, 107)
GRAY = (136, 136, 136)
DARK_GRAY = (50, 50, 50)
DARK_BOX = (40, 40, 40)

img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

try:
    font_lg = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
    font_md = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
    font_sm = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 13)
    font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
except:
    font_lg = ImageFont.load_default()
    font_md = ImageFont.load_default()
    font_sm = ImageFont.load_default()
    font_title = ImageFont.load_default()

def rounded_rect(x, y, w, h, fill, outline=None, radius=8):
    draw.rounded_rectangle([x, y, x+w, y+h], radius=radius, fill=fill, outline=outline)

def arrow_down(cx, y1, y2, color=GRAY):
    draw.line([(cx, y1), (cx, y2)], fill=color, width=2)
    draw.polygon([(cx-5, y2-8), (cx+5, y2-8), (cx, y2)], fill=color)

def arrow_right(x1, y, x2, color=GRAY):
    draw.line([(x1, y), (x2, y)], fill=color, width=2)
    draw.polygon([(x2-8, y-5), (x2-8, y+5), (x2, y)], fill=color)

# Title
draw.text((W//2 - 200, 20), "VectorLane Architecture", fill=CYAN, font=font_title)
draw.text((W//2 - 140, 55), "Searchable local memory for AI agents", fill=GRAY, font=font_md)

# === TOP ROW: Input Sources ===
sources = [
    ("Documents", "file / folder / text / url"),
    ("MemoryLane", "memory exports"),
    ("ContextLane", "context exports"),
]
sx = 100
for name, desc in sources:
    rounded_rect(sx, 110, 220, 60, DARK_BOX, outline=CYAN)
    draw.text((sx + 110 - len(name)*5, 120), name, fill=WHITE, font=font_lg)
    draw.text((sx + 110 - len(desc)*4, 145), desc, fill=GRAY, font=font_sm)
    sx += 280

# Arrows from sources down
for x in [210, 490, 770]:
    arrow_down(x, 175, 210)

# === INGEST LAYER ===
rounded_rect(150, 215, 720, 55, DARK_BOX, outline=GREEN)
draw.text((510 - 60, 225), "VectorLane Ingest", fill=GREEN, font=font_lg)
draw.text((510 - 90, 248), "text extraction  +  metadata  +  citations", fill=GRAY, font=font_sm)

arrow_down(510, 275, 310)

# === CHUNKING ===
rounded_rect(250, 315, 520, 50, DARK_BOX, outline=YELLOW)
draw.text((510 - 50, 325), "Chunking Engine", fill=YELLOW, font=font_lg)
draw.text((510 - 110, 345), "paragraph  |  fixed  |  markdown  strategies", fill=GRAY, font=font_sm)

arrow_down(510, 370, 405)

# === EMBEDDINGS ===
rounded_rect(200, 410, 620, 55, DARK_BOX, outline=CYAN)
draw.text((510 - 70, 420), "Embedding Providers", fill=CYAN, font=font_lg)
draw.text((510 - 130, 443), "local-hash (offline)  |  openai  |  tera  |  dummy", fill=GRAY, font=font_sm)

arrow_down(510, 470, 505)

# === VECTOR STORE ===
rounded_rect(150, 510, 720, 70, DARK_BOX, outline=GREEN)
draw.text((510 - 90, 520), "Local Vector Store", fill=GREEN, font=font_lg)
draw.text((510 - 120, 545), "JSONL backend  |  cosine similarity  |  metadata filters", fill=GRAY, font=font_sm)

# Storage icon
rounded_rect(890, 510, 100, 70, DARK_BOX, outline=GRAY)
draw.text((940 - 30, 525), "~/.vector", fill=GRAY, font=font_sm)
draw.text((940 - 15, 545), "lane/", fill=GRAY, font=font_sm)
arrow_right(870, 545, 890, color=GRAY)

arrow_down(510, 585, 620)

# === SEARCH / API LAYER ===
# Search box
rounded_rect(100, 625, 350, 55, DARK_BOX, outline=RED)
draw.text((275 - 40, 635), "Similarity Search", fill=RED, font=font_lg)
draw.text((275 - 70, 655), "topK  |  filters  |  ranked results", fill=GRAY, font=font_sm)

# API box
rounded_rect(500, 625, 250, 55, DARK_BOX, outline=CYAN)
draw.text((625 - 30, 635), "HTTP API", fill=CYAN, font=font_lg)
draw.text((625 - 40, 655), "port 3090  |  REST", fill=GRAY, font=font_sm)

# MCP box
rounded_rect(800, 625, 250, 55, DARK_BOX, outline=YELLOW)
draw.text((925 - 25, 635), "MCP Server", fill=YELLOW, font=font_lg)
draw.text((925 - 55, 655), "stdio JSON-RPC", fill=GRAY, font=font_sm)

# === OUTPUT ===
arrow_down(275, 685, 720)
arrow_down(625, 685, 720)
arrow_down(925, 685, 720)

rounded_rect(200, 725, 720, 50, DARK_BOX, outline=GREEN)
draw.text((560 - 100, 735), "Agent-Ready Results + Citations", fill=GREEN, font=font_lg)

out_dir = os.path.dirname(os.path.abspath(__file__))
out_path = os.path.join(out_dir, "architecture.png")
img.save(out_path, "PNG")
print(f"Saved: {out_path}")
