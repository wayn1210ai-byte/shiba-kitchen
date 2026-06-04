#!/usr/bin/env python3
"""Move builtinRecipes + functions from end of file to before Home component."""

with open('src/pages/Home.tsx', 'r') as f:
    lines = f.readlines()

# Find key line numbers (0-indexed)
home_start = None
data_start = None
file_end = len(lines)

for i, line in enumerate(lines):
    if 'export default function Home()' in line:
        home_start = i
    if '// ===== 內建食譜庫（150道）=====' in line:
        data_start = i
        break

print(f"Home component at line {home_start+1}")
print(f"Recipe data starts at line {data_start+1}")
print(f"File has {file_end} lines")

# Extract data section (from data_start to end)
data_section = lines[data_start:]

# Remove data section from its current location
lines = lines[:data_start]

# Insert data section before Home component
lines = lines[:home_start] + data_section + lines[home_start:]

# Write back
with open('src/pages/Home.tsx', 'w') as f:
    f.writelines(lines)

print(f"Done! New file has {len(lines)} lines")
print(f"Data now starts at original line {home_start+1} (before Home component)")
