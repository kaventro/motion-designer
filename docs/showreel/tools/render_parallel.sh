#!/usr/bin/env bash
set -euo pipefail
film="$(cd "$(dirname "$0")/.." && pwd)"
scripts="$film/../../skills/motion-designer/scripts"
page="${1:?usage: render_parallel.sh <page.html> <name> <seconds> <audio> [parts]}"
name="${2:?}"
seconds="${3:?}"
audio="${4:?}"
parts="${5:-3}"
work="$film/out/parts-$name"
rm -rf "$work"
mkdir -p "$work"
step=$(python3 -c "print($seconds / $parts)")
pids=()
for i in $(seq 0 $((parts - 1))); do
  from=$(python3 -c "print($i * $step)")
  to=$(python3 -c "print(($i + 1) * $step)")
  node "$scripts/render.mjs" video "$page" "$work/part$i.mp4" --scale 2 --from "$from" --to "$to" > "$work/part$i.log" 2>&1 &
  pids+=($!)
done
for i in $(seq 0 $((parts - 1))); do
  until grep -q " frames in " "$work/part$i.log" 2> /dev/null || ! kill -0 "${pids[$i]}" 2> /dev/null; do sleep 2; done
  sleep 2
  kill "${pids[$i]}" 2> /dev/null || true
  wait "${pids[$i]}" 2> /dev/null || true
  grep -q " frames in " "$work/part$i.log" || { echo "part $i failed" >&2; cat "$work/part$i.log" >&2; exit 1; }
done
: > "$work/list.txt"
for i in $(seq 0 $((parts - 1))); do echo "file 'part$i.mp4'" >> "$work/list.txt"; done
ffmpeg -v error -y -f concat -safe 0 -i "$work/list.txt" -c copy "$work/video.mp4"
ffmpeg -v error -y -i "$work/video.mp4" -i "$audio" -map 0:v -map 1:a -c copy -t "$seconds" -movflags +faststart "$film/out/$name.mp4"
echo "$film/out/$name.mp4"
