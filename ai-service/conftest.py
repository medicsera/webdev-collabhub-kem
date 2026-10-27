import sys
from pathlib import Path

# Добавляем корень ai-service в sys.path для импортов пакета app
current_dir = Path(__file__).resolve().parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))
