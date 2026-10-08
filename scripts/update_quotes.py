"""Download daily closes on GitHub Actions; preserve old quotes on provider failures."""
import json
import math
import time
from pathlib import Path
from datetime import datetime, timezone
import yfinance as yf
from zoneinfo import ZoneInfo
ROOT = Path(__file__).resolve().parents[1]
path = ROOT / 'data/quotes.json'
data = json.loads(path.read_text()) if path.exists() else {'quotes': {}}
symbols = json.loads((ROOT / 'data/symbols.json').read_text())
ok = 0
for key in symbols:
    market, symbol = key.split(':', 1)
    candidates = [symbol + '.TW', symbol + '.TWO'] if market == 'TW' else [symbol]
    for ticker in candidates:
        try:
            history = yf.Ticker(ticker).history(period='6mo', auto_adjust=False)
            zone = ZoneInfo('Asia/Taipei' if market == 'TW' else 'America/New_York')
            now = datetime.now(zone)
            closing_minutes = 13 * 60 + 30 if market == 'TW' else 16 * 60
            rows = [(date, float(value)) for date, value in history['Close'].items()
                    if math.isfinite(value) and value > 0
                    and not (date.date() == now.date() and now.hour * 60 + now.minute < closing_minutes)]
            if len(rows) < 60:
                continue
            data['quotes'][key] = {'prices': [round(v, 6) for _, v in rows[-120:]], 'asOf': rows[-1][0].strftime('%Y-%m-%d'), 'source': 'Yahoo 日K', 'updatedAt': datetime.now(timezone.utc).isoformat()}
            ok += 1
            break
        except Exception as exc:
            print(f'{key}: download failed ({type(exc).__name__})')
        finally:
            time.sleep(1)
if not ok:
    raise SystemExit('No quotes updated; existing data preserved')
data['generatedAt'] = datetime.now(timezone.utc).isoformat()
path.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n')
print(f'Updated {ok}/{len(symbols)} symbols')
