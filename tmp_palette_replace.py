from pathlib import Path

replacements = [
    ('bg-amber-950/20', 'bg-[#645e49]/20'),
    ('bg-amber-600/10', 'bg-[#bfae7d]/10'),
    ('bg-orange-600/10', 'bg-[#bfae7d]/10'),
    ('bg-amber-500/30', 'bg-[#d8d0b6]/30'),
    ('bg-amber-500/35', 'bg-[#d8d0b6]/35'),
    ('bg-amber-500/20', 'bg-[#d8d0b6]/20'),
    ('bg-amber-500/10', 'bg-[#d8d0b6]/10'),
    ('bg-orange-500/20', 'bg-[#d8d0b6]/20'),
    ('bg-orange-300/20', 'bg-[#cfbe94]/20'),
    ('bg-orange-300/10', 'bg-[#cfbe94]/10'),
    ('bg-orange-400', 'bg-[#d2c89e]'),
    ('bg-orange-500', 'bg-[#d8d0b6]'),
    ('bg-orange-600', 'bg-[#bfae7d]'),
    ('text-amber-400', 'text-[#d8d0b6]'),
    ('hover:text-amber-300', 'hover:text-[#cfbe94]'),
    ('text-amber-300', 'text-[#cfbe94]'),
    ('text-orange-300', 'text-[#cfbe94]'),
    ('text-orange-400', 'text-[#d2c89e]'),
    ('text-orange-500', 'text-[#d8d0b6]'),
    ('text-orange-600', 'text-[#bfae7d]'),
    ('border-amber-500/35', 'border-[#d8d0b6]/35'),
    ('border-amber-500/30', 'border-[#d8d0b6]/30'),
    ('border-amber-500/20', 'border-[#d8d0b6]/20'),
    ('border-amber-500', 'border-[#d8d0b6]'),
    ('border-orange-300', 'border-[#cfbe94]'),
    ('hover:bg-amber-500/10', 'hover:bg-[#d8d0b6]/10'),
    ('hover:bg-orange-500/30', 'hover:bg-[#d8d0b6]/30'),
    ('hover:text-orange-300', 'hover:text-[#cfbe94]'),
    ('shadow-orange-400/20', 'shadow-[#cfbe94]/20'),
    ('shadow-amber-500/5', 'shadow-[#d8d0b6]/5'),
    ('hover:shadow-amber-500/10', 'hover:shadow-[#d8d0b6]/10'),
    ('from-orange-300', 'from-[#cfbe94]'),
    ('from-orange-400', 'from-[#d2c89e]'),
    ('to-orange-500', 'to-[#d8d0b6]'),
    ('text-[#f59e0b]', 'text-[#cfbe94]'),
    ('text-[#fb923c]', 'text-[#d3c79d]'),
    ('text-[#fbbf24]', 'text-[#d3c79d]'),
    ('text-[#f97316]', 'text-[#d8d0b6]'),
    ('bg-[#f59e0b]/20', 'bg-[#cfbe94]/20'),
    ('border-[#f59e0b]/30', 'border-[#cfbe94]/30'),
    ('border-[#f97316]/30', 'border-[#d8d0b6]/30'),
    ('bg-[#fb923c]/10', 'bg-[#d3c79d]/10'),
    ('bg-[#fb923c]/20', 'bg-[#d3c79d]/20'),
    ('from-[#fb923c]/10', 'from-[#d3c79d]/10'),
    ('via-[#f97316]/20', 'via-[#d8d0b6]/20'),
    ('from-[#f59e0b]', 'from-[#cfbe94]'),
    ('to-[#f97316]', 'to-[#d8d0b6]'),
    ('background: linear-gradient(to right, #fbbf24, #fb923c, #f97316);', 'background: linear-gradient(to right, #cfbe94, #d3c79d, #d8d0b6);'),
    ('--color-gd-primary: #f59e0b;', '--color-gd-primary: #cfbe94;'),
    ('--color-gd-secondary: #f97316;', '--color-gd-secondary: #d8d0b6;'),
    ('--color-gd-accent: #f59e0b;', '--color-gd-accent: #dfd8d0;'),
    ('--primary: 42 100% 56%;', '--primary: 40 30% 72%;'),
    ('--secondary: 20 95% 55%;', '--secondary: 40 20% 80%;'),
    ('--accent: 42 100% 56%;', '--accent: 35 20% 85%;'),
    ('rgba(245, 158, 11, 0.25)', 'rgba(207, 190, 148, 0.25)'),
    ('bg-gradient-to-r from-[#f59e0b] via-[#fb923c] to-[#f97316]', 'bg-gradient-to-r from-[#cfbe94] via-[#d3c79d] to-[#d8d0b6]'),
    ('bg-gradient-to-tr from-[#fb923c]/10 via-[#f97316]/20 to-[#f59e0b]/10', 'bg-gradient-to-tr from-[#d3c79d]/10 via-[#d8d0b6]/20 to-[#cfbe94]/10'),
]

root = Path('src')
files = [p for p in root.rglob('*') if p.suffix in {'.ts', '.tsx', '.css'}]
modified = 0
for p in files:
    text = p.read_text(encoding='utf-8')
    original = text
    for old, new in replacements:
        text = text.replace(old, new)
    if text != original:
        p.write_text(text, encoding='utf-8')
        modified += 1
        print(f'Updated {p}')
print(f'Finished. Files modified: {modified}')
