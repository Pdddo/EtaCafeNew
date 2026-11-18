import json
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
TABLES_FILE = DATA_DIR / "tables.json"

DEFAULT_TABLES = [
    {"id": 1, "name": "Meja 1", "is_active": True},
    {"id": 2, "name": "Meja 2", "is_active": True},
    {"id": 3, "name": "Meja 3", "is_active": True},
    {"id": 4, "name": "Meja 4", "is_active": True},
    {"id": 5, "name": "Meja 5", "is_active": True},
    {"id": 6, "name": "Meja 6", "is_active": True},
    {"id": 7, "name": "Meja 7", "is_active": True},
    {"id": 8, "name": "Meja 8", "is_active": True},
    {"id": 9, "name": "Meja 9", "is_active": True},
    {"id": 10, "name": "Meja 10", "is_active": True},
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
                # Normalisasi: pastikan setiap meja memiliki field is_active
                for item in data:
                    if "is_active" not in item:
                        item["is_active"] = True
                return data
            return DEFAULT_TABLES
    except Exception:
        return DEFAULT_TABLES

def add_new_table(name: str, is_active: bool = True) -> Dict[str, Any]:
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
    new_table = {"id": new_id, "name": name_clean, "is_active": is_active}
    tables.append(new_table)

    with open(TABLES_FILE, "w", encoding="utf-8") as f:
        json.dump(tables, f, indent=2, ensure_ascii=False)

    return new_table

def update_table(table_id: int, name: Optional[str] = None, is_active: Optional[bool] = None) -> Dict[str, Any]:
    """Mengubah nama atau status aktif/nonaktif suatu meja."""
    tables = get_all_tables()
    target = next((t for t in tables if t.get("id") == table_id), None)
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meja dengan ID {table_id} tidak ditemukan."
        )

    if name is not None:
        name_clean = name.strip()
        if not name_clean:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nama meja tidak boleh kosong."
            )
        # Cek duplikasi dengan meja lain
        for t in tables:
            if t.get("id") != table_id and t.get("name", "").strip().lower() == name_clean.lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Meja dengan nama '{name_clean}' sudah digunakan."
                )
        target["name"] = name_clean

    if is_active is not None:
        target["is_active"] = bool(is_active)

    with open(TABLES_FILE, "w", encoding="utf-8") as f:
        json.dump(tables, f, indent=2, ensure_ascii=False)

    return target

def toggle_table_status(table_id: int) -> Dict[str, Any]:
    """Mengaktifkan / menonaktifkan ketersediaan meja (tersedia vs maintenance/pemeliharaan)."""
    tables = get_all_tables()
    target = next((t for t in tables if t.get("id") == table_id), None)
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meja dengan ID {table_id} tidak ditemukan."
        )

    target["is_active"] = not target.get("is_active", True)

    with open(TABLES_FILE, "w", encoding="utf-8") as f:
        json.dump(tables, f, indent=2, ensure_ascii=False)

    return target

def reorder_tables(table_ids: List[int]) -> List[Dict[str, Any]]:
    """Menata ulang urutan meja berdasarkan daftar urutan ID yang dikirim (Drag and Drop Reordering)."""
    tables = get_all_tables()
    table_map = {t.get("id"): t for t in tables}

    reordered = []
    for tid in table_ids:
        if tid in table_map:
            reordered.append(table_map.pop(tid))

    # Masukkan sisa meja jika ada yang tidak terdaftar di payload
    for remaining in table_map.values():
        reordered.append(remaining)

    with open(TABLES_FILE, "w", encoding="utf-8") as f:
        json.dump(reordered, f, indent=2, ensure_ascii=False)

    return reordered

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
