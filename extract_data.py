#!/usr/bin/env python3
"""Extract builtinRecipes + matching functions to separate file, import in Home.tsx."""

with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()
    lines = content.split('\n')

# Find boundaries
data_start = None  # // ===== 內建食譜庫
data_end = None    # just before export default function Home()

for i, line in enumerate(lines):
    if data_start is None and '// ===== 內建食譜庫（150道）=====' in line:
        data_start = i
    if data_start is not None and 'export default function Home()' in line:
        data_end = i
        break

print(f"Data section: lines {data_start+1} to {data_end}")

# Extract data section
data_lines = lines[data_start:data_end]

# Write to separate file
with open('src/data/recipes_data.ts', 'w') as f:
    f.write('// 內建食譜庫（150道）與比對引擎\n')
    f.write('// Auto-extracted from Home.tsx\n\n')
    f.write('import type { Recipe } from "../pages/Home";\n\n')
    f.write('\n'.join(data_lines))
    f.write('\n')

print(f"Written src/data/recipes_data.ts ({len(data_lines)} lines)")

# Remove data section from Home.tsx
lines = lines[:data_start] + lines[data_end:]

# Add import for the data
# Find where to add the import (after the last import/category line, before Home component)
import_end = 0
for i, line in enumerate(lines):
    if line.strip().startswith('const categories') or line.strip().startswith('const categoryOrderMap'):
        import_end = i + 1

# Add import
import_line = "import { builtinRecipes, matchBuiltinRecipe, scoreRecipe, suggestIngredients, findSimilarRecipes } from \"@/data/recipes_data\";\n"
lines.insert(import_end, import_line)

with open('src/pages/Home.tsx', 'w') as f:
    f.write('\n'.join(lines))

print(f"Updated Home.tsx ({len(lines)} lines)")
print(f"Added import at line {import_end+1}")
