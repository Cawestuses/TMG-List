from pathlib import Path

mapping = {
    'text-purple-400': 'text-amber-400',
    'hover:text-purple-300': 'hover:text-amber-300',
    'bg-purple-500/10': 'bg-amber-500/10',
    'bg-purple-500/20': 'bg-amber-500/20',
    'bg-purple-500/30': 'bg-amber-500/30',
    'bg-purple-600': 'bg-amber-600',
    'border-purple-500/20': 'border-amber-500/20',
    'border-purple-500/30': 'border-amber-500/30',
    'border-purple-500/35': 'border-amber-500/35',
    'shadow-purple-500/5': 'shadow-amber-500/5',
    'shadow-purple-500/10': 'shadow-amber-500/10',
    'shadow-purple-500/20': 'shadow-amber-500/20',
    'hover:bg-purple-500/10': 'hover:bg-amber-500/10',
    'hover:bg-purple-500/30': 'hover:bg-amber-500/30',
    'from-purple-500': 'from-amber-400',
    'to-cyan-500': 'to-orange-500',
    'from-cyan-500': 'from-orange-400',
    'to-blue-500': 'to-orange-500',
    'from-cyan-400': 'from-orange-300',
    'text-cyan-400': 'text-orange-300',
    'hover:text-cyan-400': 'hover:text-orange-300',
    'bg-cyan-500/20': 'bg-orange-300/20',
    'border-cyan-500/30': 'border-amber-300/30',
    'bg-cyan-600': 'bg-orange-600',
    'hover:bg-cyan-500': 'hover:bg-orange-500',
    'shadow-cyan-500/15': 'shadow-orange-400/15',
    'shadow-cyan-500/20': 'shadow-orange-400/20',
    'border-cyan-500/50': 'border-amber-300/50',
    'focus:border-cyan-500/50': 'focus:border-amber-300/50',
    'bg-cyan-500/10': 'bg-orange-300/10',
    'text-white/80 hover:text-purple-400': 'text-white/80 hover:text-amber-300',
    'bg-purple-950/20': 'bg-amber-950/20',
    'bg-purple-500': 'bg-amber-500',
    'border-purple-500': 'border-amber-500',
    'bg-cyan-400': 'bg-orange-300',
    'from-cyan-500 to-blue-500': 'from-orange-400 to-orange-500',
    'bg-cyan-500/30': 'bg-orange-300/30',
    'border-cyan-500': 'border-amber-300',
}

files = list(Path('src').rglob('*.ts')) + list(Path('src').rglob('*.tsx')) + list(Path('src').rglob('*.css'))
for p in files:
    text = p.read_text(encoding='utf-8')
    new_text = text
    for old, new in mapping.items():
        new_text = new_text.replace(old, new)
    if new_text != text:
        p.write_text(new_text, encoding='utf-8')
        print(f'updated {p}')
