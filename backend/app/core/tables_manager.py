import json
import os
from pathlib import Path
from typing import List, Dict, Any
from fastapi import HTTPException, status

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
TABLES_FILE = DATA_DIR / "tables.json"

DEFAULT_TABLES = [
    {"id": 1, "name": "Meja 1"},
    {"id": 2, "name": "Meja 2"},
    {"id": 3, "name": "Meja 3"},
    {"id": 4, "name": "Meja 4"},
    {"id": 5, "name": "Meja 5"},
    {"id": 6, "name": "Meja 6"},
    {"id": 7, "name": "Meja 7"},
    {"id": 8, "name": "Meja 8"},
    {"id": 9, "name": "Meja 9"},
    {"id": 10, "name": "Meja 10"},
]

def _ensure_file_exists():
    """Memastikan direktori dan file tables.json ada dengan data awal jika baru dibuat."""
    if not DATA_DIR.exists():
        DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not TABLES_FILE.exists():
        with open(TABLES_FILE, "w", encoding="utf-8") as f:
            json.dump(DEFAULT_TABLES, f, indent=2, ensure_ascii=False)

def get_all_tables() -> List[Dict[str, Any]]:
    """Membaca seluruh daftar meja dari file tables.json."""
    _ensure_file_exists()
    try:
        with open(TABLES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            return DEFAULT_TABLES
    except Exception:
        return DEFAULT_TABLES

def add_new_table(name: str) -> Dict[str, Any]:
    """Menambahkan meja baru ke file tables.json."""
    name_clean = name.strip()
    if not name_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nama atau nomor meja tidak boleh kosong."
        )

    tables = get_all_tables()
    for t in tables:
        if t.get("name", "").strip().lower() == name_clean.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Meja dengan nama '{name_clean}' sudah ada."
            )

    new_id = max([t.get("id", 0) for t in tables], default=0) + 1
    new_table = {"id": new_id, "name": name_clean}
    tables.append(new_table)

    with open(TABLES_FILE, "w", encoding="utf-8") as f:
        json.dump(tables, f, indent=2, ensure_ascii=False)

    return new_table

def remove_table(table_id: int) -> bool:
    """Menghapus meja berdasarkan id dari file tables.json."""
    tables = get_all_tables()
    table_to_remove = next((t for t in tables if t.get("id") == table_id), None)
    if not table_to_remove:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meja dengan ID {table_id} tidak ditemukan."
        )

    updated_tables = [t for t in tables if t.get("id") != table_id]
    with open(TABLES_FILE, "w", encoding="utf-8") as f:
        json.dump(updated_tables, f, indent=2, ensure_ascii=False)

    return True

