#!/usr/bin/env python3
"""Export Karios TIP-017 资金流全景 → data/national-team.json (static, daily).

Reuses karios-desktop `_load_flow_rows` (same units as desktop 资金流全景):
  - 国家队: etfShareYi (亿份, 4 ETF)
  - 两融: marginTrillion (万亿元, 仅三所齐全日)
  - 北向: northDailyYi / northD20Yi (亿元; 2024-08-19 后为成交额口径)

Does NOT export private strategy weights / S-3 legs / holder name lists.

Usage:
  npm run sync-national-team
  # or: python3 scripts/sync-national-team.py
"""
from __future__ import annotations

import json
import os
import sys
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "national-team.json"
KARIOS_DESKTOP = Path("/Users/huangyuan/Projects/karios-desktop")
DSS_SRC = KARIOS_DESKTOP / "services" / "data-sync-service" / "src"
ENV_FILE = KARIOS_DESKTOP / ".env"
SHANGHAI = ZoneInfo("Asia/Shanghai")
HSGT_BREAK = "2024-08-19"
CODES = ("510300.SH", "510500.SH", "510510.SH", "159915.SZ")


def load_database_url() -> str:
    for line in ENV_FILE.read_text().splitlines():
        if line.startswith("DATABASE_URL="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit("sync-national-team: DATABASE_URL missing in karios-desktop/.env")


def main() -> None:
    os.environ["DATABASE_URL"] = load_database_url()
    sys.path.insert(0, str(DSS_SRC))
    from data_sync_service.api.backtest_routes import _load_flow_rows

    end = date.today().isoformat()
    # ~3y warm enough for 1y display + windows; payload trimmed below
    start = (date.today() - timedelta(days=400)).isoformat()
    rows = _load_flow_rows(start, end)
    if not rows:
        raise SystemExit("sync-national-team: empty flow rows")

    # Keep last ~252 trading rows for charts (1y-ish)
    keep = int(os.environ.get("NATIONAL_TEAM_DAYS", "252"))
    series = rows[-keep:]

    # latest with any of the three levels
    last = None
    for r in reversed(series):
        if r.get("etfShareYi") is not None or r.get("marginTrillion") is not None:
            last = r
            break
    if last is None:
        last = series[-1]

    # Public display fields only (drop smNetPct / gate internals if we want — keep gateOn
    # as optional chip but Yuan asked simple charts; still include gateOn in JSON for future)
    slim = []
    for r in series:
        slim.append(
            {
                "date": r["date"],
                "etfShareYi": r.get("etfShareYi"),
                "etfShareD20Pct": r.get("etfShareD20Pct"),
                "marginTrillion": r.get("marginTrillion"),
                "marginD20Pct": r.get("marginD20Pct"),
                "northDailyYi": r.get("northDailyYi"),
                "northD20Yi": r.get("northD20Yi"),
                "northIsTurnover": r.get("northIsTurnover"),
            }
        )

    payload = {
        "generated": datetime.now(SHANGHAI).strftime("%Y-%m-%d %H:%M Asia/Shanghai"),
        "asof": last["date"],
        "source": {
            "builder": "karios-desktop data_sync_service.api.backtest_routes._load_flow_rows",
            "tables": ["cn_etf_share", "cn_margin_total", "cn_moneyflow_hsgt", "index_daily", "daily"],
            "codes": list(CODES),
            "hsgtBreakDate": HSGT_BREAK,
            "note": (
                "与 Karios 桌面「资金流全景」同源：国家队=四码宽基 ETF 份额代理；"
                "两融=三所齐全日 rzye 合计；北向=north_money（2024-08-19 后为成交额口径，非净买）。"
                "非汇金/证金个股持仓名单；不做交易信号。"
            ),
        },
        "summary": {
            "asof": last["date"],
            "etfShareYi": last.get("etfShareYi"),
            "etfShareD20Pct": last.get("etfShareD20Pct"),
            "marginTrillion": last.get("marginTrillion"),
            "marginD20Pct": last.get("marginD20Pct"),
            "northD20Yi": last.get("northD20Yi"),
            "northIsTurnover": last.get("northIsTurnover"),
            "n_days": len(slim),
            "range": {"from": slim[0]["date"], "to": slim[-1]["date"]},
        },
        "series": slim,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "ok": True,
                "out": str(OUT),
                "asof": payload["asof"],
                "n": len(slim),
                "etfShareYi": last.get("etfShareYi"),
                "marginTrillion": last.get("marginTrillion"),
                "northD20Yi": last.get("northD20Yi"),
                "bytes": OUT.stat().st_size,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
