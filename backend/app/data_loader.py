"""
Carga y normalización de registros de puffs desde archivos CSV.

Soporta dos familias de formatos (y combinaciones de columnas):

1. Formato automático (reloj inteligente):
   user_id, timestamp, date, daily_limit, puff_number, within_limit
   → cada fila es un puff individual.

2. Formato manual (app antigua):
   user_id, date, puffs (o cantidad/count/numero_de_caladas)
   → cada fila agrega N puffs de ese día.

El loader normaliza todo a un esquema canónico:
    user_id, timestamp (datetime|None), date (date), daily_limit (int|None),
    within_limit (bool|None), source ('watch' | 'manual')
y recalcula `within_limit` cuando es posible.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

# Columnas alternativas aceptadas -> nombre canónico
COLUMN_ALIASES: dict[str, str] = {
    "user_id": "user_id",
    "userid": "user_id",
    "id_usuario": "user_id",
    "timestamp": "timestamp",
    "fecha_hora": "timestamp",
    "date": "date",
    "fecha": "date",
    "daily_limit": "daily_limit",
    "limite_diario": "daily_limit",
    "puff_number": "puff_number",
    "puff": "puff_number",
    "calada_numero": "puff_number",
    "within_limit": "within_limit",
    "dentro_del_limite": "within_limit",
    "puffs": "puffs_count",
    "puff_count": "puffs_count",
    "cantidad": "puffs_count",
    "count": "puffs_count",
    "numero_de_caladas": "puffs_count",
    "caladas": "puffs_count",
}


@dataclass
class LoadResult:
    df: pd.DataFrame
    files: list[str]
    skipped: list[str]


def _canonicalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Mapea nombres de columnas (case-insensitive, sin espacios) al esquema canónico."""
    rename: dict[str, str] = {}
    for col in df.columns:
        key = str(col).strip().lower().replace(" ", "_")
        if key in COLUMN_ALIASES:
            rename[col] = COLUMN_ALIASES[key]
    return df.rename(columns=rename)


def _to_bool(series: pd.Series) -> pd.Series:
    if series.dtype == bool:
        return series
    mapped = series.astype(str).str.strip().str.lower().map(
        {"true": True, "false": False, "1": True, "0": False,
         "verdadero": True, "falso": False, "si": True, "no": False}
    )
    return mapped.astype("boolean")


def _normalize_file(path: Path) -> pd.DataFrame | None:
    """Normaliza un CSV al esquema canónico. Devuelve None si no es utilizable."""
    try:
        raw = pd.read_csv(path, encoding="utf-8-sig")
    except UnicodeDecodeError:
        raw = pd.read_csv(path, encoding="latin-1")

    df = _canonicalize_columns(raw)

    if "user_id" not in df.columns:
        return None

    # Formato individual (una fila = un puff)
    if "puff_number" in df.columns or "timestamp" in df.columns:
        df["puffs_count"] = 1
        df["source"] = "watch"
    # Formato agregado/manual (una fila = N puffs de un día)
    elif "puffs_count" in df.columns:
        df["source"] = "manual"
    else:
        # Sin forma de contar puffs: no sirve
        return None

    if "timestamp" in df.columns:
        df["timestamp"] = pd.to_datetime(
            df["timestamp"].astype(str).str.replace(r"\s+", " ", regex=True).str.strip(),
            utc=True, errors="coerce",
        )
    else:
        df["timestamp"] = pd.NaT

    if "date" not in df.columns or df["date"].isna().all():
        if df["timestamp"].notna().any():
            df["date"] = df["timestamp"].dt.tz_convert(None).dt.date.astype(str)
        else:
            return None
    else:
        df["date"] = pd.to_datetime(df["date"], errors="coerce").dt.date.astype(str)

    if "daily_limit" in df.columns:
        df["daily_limit"] = pd.to_numeric(df["daily_limit"], errors="coerce").astype("Int64")
    else:
        df["daily_limit"] = pd.NA

    if "within_limit" in df.columns:
        df["within_limit"] = _to_bool(df["within_limit"])
    else:
        df["within_limit"] = pd.NA

    if "puff_number" not in df.columns:
        df["puff_number"] = pd.NA
    else:
        df["puff_number"] = pd.to_numeric(df["puff_number"], errors="coerce").astype("Int64")

    out = pd.DataFrame(
        {
            "user_id": df["user_id"].astype(str).str.strip(),
            "timestamp": df["timestamp"],
            "date": df["date"],
            "daily_limit": df["daily_limit"],
            "puff_number": df["puff_number"],
            "within_limit": df["within_limit"],
            "puffs_count": pd.to_numeric(df["puffs_count"], errors="coerce").fillna(1).astype(int),
            "source": df["source"],
            "file": path.name,
        }
    )
    return out.dropna(subset=["user_id", "date"])


def _recalculate_within_limit(df: pd.DataFrame) -> pd.DataFrame:
    """
    Recalcula within_limit donde sea posible:
    - Formato watch: within_limit = (puff_number <= daily_limit).
    - Resto: por (user_id, date), los primeros `daily_limit` puffs cuentan
      como dentro del límite (ordenados por timestamp si existe).
    """
    if df.empty:
        return df
    df = df.copy()

    # Para formato watch con puff_number usamos ese número directamente
    mask_watch = (df["source"] == "watch") & df["puff_number"].notna() & df["daily_limit"].notna()
    df.loc[mask_watch, "within_limit"] = (
        df.loc[mask_watch, "puff_number"] <= df.loc[mask_watch, "daily_limit"]
    )

    # Para registros sin within_limit calculado: contar acumulado por día
    remaining = df["within_limit"].isna() & df["daily_limit"].notna()
    if remaining.any():
        for (_user, _date), idx in df[remaining].groupby(["user_id", "date"]).groups.items():
            limit = df.loc[idx, "daily_limit"].iloc[0]
            if pd.isna(limit):
                continue
            # orden por timestamp cuando exista, si no orden de archivo
            ordered = df.loc[idx].sort_values("timestamp", na_position="last")
            positions = range(1, len(ordered) + 1)
            values = pd.Series([p <= limit for p in positions], index=ordered.index)
            df.loc[values.index, "within_limit"] = values

    return df


def load_all() -> LoadResult:
    """Carga y concatena todos los CSV de DATA_DIR (recalculando within_limit)."""
    files: list[str] = []
    skipped: list[str] = []
    frames: list[pd.DataFrame] = []

    if DATA_DIR.exists():
        for path in sorted(DATA_DIR.glob("*.csv")):
            normalized = _normalize_file(path)
            if normalized is None or normalized.empty:
                skipped.append(path.name)
                continue
            frames.append(normalized)
            files.append(path.name)

    if not frames:
        return LoadResult(df=pd.DataFrame(), files=[], skipped=skipped)

    df = pd.concat(frames, ignore_index=True)
    df = _recalculate_within_limit(df)
    df = df.sort_values(["user_id", "date", "timestamp"], kind="stable").reset_index(drop=True)
    return LoadResult(df=df, files=files, skipped=skipped)

