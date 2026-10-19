"""
API del dashboard clínico de consumo de nicotina (prototipo).

Lee CSV locales de `backend/data` (sin base de datos) y expone endpoints
agregados para el dashboard dirigido a neumólogos/psicólogos.
"""
from __future__ import annotations

from datetime import date, datetime, timezone

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .data_loader import DATA_DIR, LoadResult, load_all

app = FastAPI(
    title="4Soles · Dashboard Clínico API",
    description="Prototipo: patrones de consumo de nicotina a partir de CSV exportados por la app.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Estado en memoria (se recarga con POST /api/reload al añadir/quitar CSV)
# ---------------------------------------------------------------------------
_STATE: LoadResult = LoadResult(df=pd.DataFrame(), files=[], skipped=[])


def _refresh() -> None:
    global _STATE
    _STATE = load_all()


_refresh()


def _require_user(user_id: str) -> None:
    if _STATE.df.empty or user_id not in set(_STATE.df["user_id"]):
        raise HTTPException(status_code=404, detail=f"Usuario '{user_id}' no encontrado en los CSV.")


def _daily_frame(df: pd.DataFrame) -> pd.DataFrame:
    """Agrega puffs a nivel día para un usuario."""
    grouped = df.groupby("date", as_index=False).agg(
        puff_count=("puffs_count", "sum"),
        daily_limit=("daily_limit", "max"),
        within_count=("within_limit", lambda s: int((s == True).sum())),  # noqa: E712
        events=("within_limit", "size"),
    )
    grouped["over_count"] = grouped["events"] - grouped["within_count"]
    grouped["pct_within"] = (
        (grouped["within_count"] / grouped["events"] * 100).round(1)
    )
    grouped["within_day"] = grouped.apply(
        lambda r: bool(
            pd.isna(r["daily_limit"]) or r["puff_count"] <= r["daily_limit"]
        ),
        axis=1,
    )
    return grouped.sort_values("date").reset_index(drop=True)



# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/health")
def health() -> dict:
    return {
        "status": "ok",
        "files": _STATE.files,
        "skipped": _STATE.skipped,
        "rows": int(len(_STATE.df)),
        "users": int(_STATE.df["user_id"].nunique()) if not _STATE.df.empty else 0,
        "data_dir": str(DATA_DIR),
        "server_time": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/api/reload")
def reload_data() -> dict:
    """Vuelve a leer los CSV de la carpeta data/ (útil al añadir archivos)."""
    _refresh()
    return {"files": _STATE.files, "skipped": _STATE.skipped, "rows": int(len(_STATE.df))}


@app.get("/api/users")
def list_users() -> list[dict]:
    if _STATE.df.empty:
        return []
    out: list[dict] = []
    for user_id, g in _STATE.df.groupby("user_id"):
        daily = _daily_frame(g)
        out.append(
            {
                "user_id": user_id,
                "events": int(len(g)),
                "days": int(len(daily)),
                "first_date": str(daily["date"].min()),
                "last_date": str(daily["date"].max()),
                "sources": sorted(set(g["source"])),
            }
        )
    return sorted(out, key=lambda u: u["last_date"], reverse=True)


@app.get("/api/users/{user_id}/summary")
def user_summary(
    user_id: str,
    start: date | None = Query(None),
    end: date | None = Query(None),
) -> dict:
    _require_user(user_id)
    df = _STATE.df[_STATE.df["user_id"] == user_id]
    if start:
        df = df[df["date"] >= start.isoformat()]
    if end:
        df = df[df["date"] <= end.isoformat()]
    if df.empty:
        raise HTTPException(status_code=404, detail="Sin registros en el rango indicado.")

    daily = _daily_frame(df)
    total_puffs = int(daily["puff_count"].sum())
    days = int(len(daily))
    within_days = int(daily["within_day"].sum())
    last = daily.iloc[-1]
    avg = round(total_puffs / days, 1) if days else 0

    # Comparación últimos 7 días con los 7 previos (tendencia de reducción)
    tail = daily.tail(14)
    recent = tail.tail(7)["puff_count"].mean() if len(tail) >= 1 else None
    prev = tail.head(len(tail) - 7)["puff_count"].mean() if len(tail) > 7 else None
    trend_pct = (
        round((recent - prev) / prev * 100, 1) if (prev not in (None, 0)) else None
    )

    return {
        "user_id": user_id,
        "total_puffs": total_puffs,
        "days": days,
        "avg_puffs_per_day": avg,
        "days_within_limit": within_days,
        "days_over_limit": days - within_days,
        "pct_days_within_limit": round(within_days / days * 100, 1) if days else 0,
        "last_date": str(last["date"]),
        "last_day_puffs": int(last["puff_count"]),
        "last_day_limit": None if pd.isna(last["daily_limit"]) else int(last["daily_limit"]),
        "last_day_within": bool(last["within_day"]),
        "trend_last7_pct": trend_pct,
        "date_range": {"start": str(daily["date"].min()), "end": str(daily["date"].max())},
    }


@app.get("/api/users/{user_id}/daily")
def user_daily(
    user_id: str,
    start: date | None = Query(None),
    end: date | None = Query(None),
) -> list[dict]:
    _require_user(user_id)
    df = _STATE.df[_STATE.df["user_id"] == user_id]
    if start:
        df = df[df["date"] >= start.isoformat()]
    if end:
        df = df[df["date"] <= end.isoformat()]
    daily = _daily_frame(df)
    return [
        {
            "date": str(r["date"]),
            "puff_count": int(r["puff_count"]),
            "daily_limit": None if pd.isna(r["daily_limit"]) else int(r["daily_limit"]),
            "within_count": int(r["within_count"]),
            "over_count": int(r["over_count"]),
            "pct_within": float(r["pct_within"]),
            "within_day": bool(r["within_day"]),
        }
        for _, r in daily.iterrows()
    ]


@app.get("/api/users/{user_id}/hourly")
def user_hourly(
    user_id: str,
    start: date | None = Query(None),
    end: date | None = Query(None),
) -> list[dict]:
    """Distribución horaria de los puffs (hora del timestamp UTC)."""
    _require_user(user_id)
    df = _STATE.df[_STATE.df["user_id"] == user_id].dropna(subset=["timestamp"])
    if start:
        df = df[df["date"] >= start.isoformat()]
    if end:
        df = df[df["date"] <= end.isoformat()]
    if df.empty:
        return []
    hours = df["timestamp"].dt.tz_convert(None).dt.hour
    counts = hours.value_counts().reindex(range(24), fill_value=0).sort_index()
    return [{"hour": int(h), "puffs": int(c)} for h, c in counts.items()]


@app.get("/api/users/{user_id}/puffs")
def user_puffs(
    user_id: str,
    day: date | None = Query(None),
    limit: int = Query(200, ge=1, le=5000),
) -> list[dict]:
    """Detalle de puffs de un día concreto (para el timeline intra-día)."""
    _require_user(user_id)
    df = _STATE.df[_STATE.df["user_id"] == user_id]
    if day:
        df = df[df["date"] == day.isoformat()]
    df = df.tail(limit)
    return [
        {
            "timestamp": r["timestamp"].isoformat() if pd.notna(r["timestamp"]) else None,
            "date": str(r["date"]),
            "puff_number": None if pd.isna(r["puff_number"]) else int(r["puff_number"]),
            "daily_limit": None if pd.isna(r["daily_limit"]) else int(r["daily_limit"]),
            "within_limit": None if pd.isna(r["within_limit"]) else bool(r["within_limit"]),
            "source": r["source"],
        }
        for _, r in df.iterrows()
    ]
