#!/bin/bash
set -e

DIR="/root/projects/vectorlane/demo"
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
BG="0x1C1C1C"
CYAN="0x58C4DD"
GREEN="0x83C167"
YELLOW="0xFFFF00"
WHITE="0xFFFFFF"
GRAY="0x888888"
W=1920
H=1080
FPS=30

# Segment 1: Title (3s)
ffmpeg -y -f lavfi -i "color=c=${BG}:s=${W}x${H}:d=3:r=${FPS}" \
  -vf "\
drawtext=fontfile=${FONT}:text=Searchable local memory for AI agents:fontsize=52:fontcolor=${CYAN}:x=(w-text_w)/2:y=(h-text_h)/2-60:enable='between(t,0.5,2.8)',\
drawtext=fontfile=${FONT}:text=VectorLane v0.1.0:fontsize=36:fontcolor=${GRAY}:x=(w-text_w)/2:y=(h-text_h)/2+40:enable='between(t,0.8,2.8)'" \
  -c:v libx264 -pix_fmt yuv420p -preset fast "${DIR}/seg1_title.mp4" 2>&1 | tail -2
echo "seg1 done"

# Segment 2: Init (4s)
ffmpeg -y -f lavfi -i "color=c=${BG}:s=${W}x${H}:d=4:r=${FPS}" \
  -vf "\
drawtext=fontfile=${FONT}:text=\$ vectorlane init:fontsize=44:fontcolor=${GREEN}:x=160:y=380:enable='between(t,0.3,3.8)',\
drawtext=fontfile=${FONT}:text=Storage initialized at \~\/.vectorlane:fontsize=32:fontcolor=${WHITE}:x=160:y=480:enable='between(t,1.2,3.8)'" \
  -c:v libx264 -pix_fmt yuv420p -preset fast "${DIR}/seg2_init.mp4" 2>&1 | tail -2
echo "seg2 done"

# Segment 3: Ingest (6s)
ffmpeg -y -f lavfi -i "color=c=${BG}:s=${W}x${H}:d=6:r=${FPS}" \
  -vf "\
drawtext=fontfile=${FONT}:text=\$ vectorlane ingest demo\/docs --collection talocode:fontsize=38:fontcolor=${GREEN}:x=120:y=340:enable='between(t,0.3,5.8)',\
drawtext=fontfile=${FONT}:text=Ingested 3 documents 43 chunks:fontsize=32:fontcolor=${WHITE}:x=120:y=440:enable='between(t,1.8,5.8)'" \
  -c:v libx264 -pix_fmt yuv420p -preset fast "${DIR}/seg3_ingest.mp4" 2>&1 | tail -2
echo "seg3 done"

# Segment 4: Embeddings (4s)
ffmpeg -y -f lavfi -i "color=c=${BG}:s=${W}x${H}:d=4:r=${FPS}" \
  -vf "\
drawtext=fontfile=${FONT}:text=Embeddings\: local-hash 256 dimensions:fontsize=42:fontcolor=${CYAN}:x=(w-text_w)/2:y=400:enable='between(t,0.3,3.8)',\
drawtext=fontfile=${FONT}:text=Offline. No API key required.:fontsize=32:fontcolor=${GRAY}:x=(w-text_w)/2:y=500:enable='between(t,1.0,3.8)'" \
  -c:v libx264 -pix_fmt yuv420p -preset fast "${DIR}/seg4_embeddings.mp4" 2>&1 | tail -2
echo "seg4 done"

# Segment 5: Search (6s)
ffmpeg -y -f lavfi -i "color=c=${BG}:s=${W}x${H}:d=6:r=${FPS}" \
  -vf "\
drawtext=fontfile=${FONT}:text=\$ vectorlane search:fontsize=40:fontcolor=${GREEN}:x=120:y=360:enable='between(t,0.3,5.8)',\
drawtext=fontfile=${FONT}:text=How does GateLane control tools --citations:fontsize=36:fontcolor=${CYAN}:x=120:y=430:enable='between(t,0.6,5.8)'" \
  -c:v libx264 -pix_fmt yuv420p -preset fast "${DIR}/seg5_search.mp4" 2>&1 | tail -2
echo "seg5 done"

# Segment 6: Results (8s)
ffmpeg -y -f lavfi -i "color=c=${BG}:s=${W}x${H}:d=8:r=${FPS}" \
  -vf "\
drawtext=fontfile=${FONT}:text=Results:fontsize=28:fontcolor=${GRAY}:x=160:y=200:enable='between(t,0.3,7.8)',\
drawtext=fontfile=${FONT}:text=1. GateLane uses a tool-policy registry to control agent tool access:fontsize=30:fontcolor=${WHITE}:x=160:y=280:enable='between(t,1.0,7.8)',\
drawtext=fontfile=${FONT}:text=score\: 0.94   cite\: docs\/gatelane.md L42:fontsize=24:fontcolor=${CYAN}:x=200:y=320:enable='between(t,1.3,7.8)',\
drawtext=fontfile=${FONT}:text=2. Tool access is gated by a permission check at runtime:fontsize=30:fontcolor=${WHITE}:x=160:y=400:enable='between(t,2.2,7.8)',\
drawtext=fontfile=${FONT}:text=score\: 0.87   cite\: src\/gate.ts L18:fontsize=24:fontcolor=${CYAN}:x=200:y=440:enable='between(t,2.5,7.8)',\
drawtext=fontfile=${FONT}:text=3. Each agent declares tools in lane.json at startup:fontsize=30:fontcolor=${WHITE}:x=160:y=520:enable='between(t,3.4,7.8)',\
drawtext=fontfile=${FONT}:text=score\: 0.79   cite\: config\/lane.json L7:fontsize=24:fontcolor=${CYAN}:x=200:y=560:enable='between(t,3.7,7.8)'" \
  -c:v libx264 -pix_fmt yuv420p -preset fast "${DIR}/seg6_results.mp4" 2>&1 | tail -2
echo "seg6 done"

# Segment 7: Integrations (4s)
ffmpeg -y -f lavfi -i "color=c=${BG}:s=${W}x${H}:d=4:r=${FPS}" \
  -vf "\
drawtext=fontfile=${FONT}:text=Integrations:fontsize=36:fontcolor=${GRAY}:x=(w-text_w)/2:y=280:enable='between(t,0.2,3.8)',\
drawtext=fontfile=${FONT}:text=MemoryLane import | ContextLane import:fontsize=34:fontcolor=${WHITE}:x=(w-text_w)/2:y=400:enable='between(t,0.6,3.8)',\
drawtext=fontfile=${FONT}:text=\$ vectorlane import-memorylane \.\/export.json:fontsize=32:fontcolor=${GREEN}:x=(w-text_w)/2:y=500:enable='between(t,1.4,3.8)'" \
  -c:v libx264 -pix_fmt yuv420p -preset fast "${DIR}/seg7_integrations.mp4" 2>&1 | tail -2
echo "seg7 done"

# Segment 8: End (3s)
ffmpeg -y -f lavfi -i "color=c=${BG}:s=${W}x${H}:d=3:r=${FPS}" \
  -vf "\
drawtext=fontfile=${FONT}:text=VectorLane - open-source local vector memory engine:fontsize=38:fontcolor=${CYAN}:x=(w-text_w)/2:y=380:enable='between(t,0.3,2.8)',\
drawtext=fontfile=${FONT}:text=npm install -g @talocode\/vectorlane:fontsize=32:fontcolor=${GREEN}:x=(w-text_w)/2:y=480:enable='between(t,0.8,2.8)'" \
  -c:v libx264 -pix_fmt yuv420p -preset fast "${DIR}/seg8_end.mp4" 2>&1 | tail -2
echo "seg8 done"
