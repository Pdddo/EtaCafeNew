// ============================================================
// HALAMAN : ProductsPage
// PERAN   : pelanggan
// ROUTE   : /pelanggan/products
// ============================================================

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PelangganAPI, MenuItemData, CategoryData } from "../../api/pelanggan";
import { useCart, formatRupiah } from "../../context/CartContext";
import "./ProductsPage.css";

export default function ProductsPage({ initialType = "coffee" }: { initialType?: "coffee" | "pastry" }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItemData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | string>("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const categoryMap: Record<number, string> = {
    1: "Kopi & Minuman",
    2: "Makanan Utama",
    3: "Camilan & Snack",
    4: "Dessert & Penutup",
  };

  useEffect(() => {
    let isMounted = true;
    async function loadMenu() {
      setLoading(true);
      try {
        const data = await PelangganAPI.getMenu();
        if (isMounted) {
          setMenuItems(data);
          setFilteredItems(data);
        }
      } catch (err) {
        console.warn("Gagal memuat menu dari API, menggunakan fallback:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadMenu();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (selectedCategoryId === "all") {
      setFilteredItems(menuItems);
    } else {
      setFilteredItems(menuItems.filter((item) => item.category_id === Number(selectedCategoryId)));
    }
  }, [selectedCategoryId, menuItems]);

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredItems(
        menuItems.filter((item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else if (selectedCategoryId === "all") {
      setFilteredItems(menuItems);
    } else {
      setFilteredItems(menuItems.filter((item) => item.category_id === Number(selectedCategoryId)));
    }
  }, [searchQuery, selectedCategoryId, menuItems]);

  const handleAddToCart = (e: React.MouseEvent, item: MenuItemData) => {
    e.stopPropagation();
    addToCart(item, 1);
    setToastMessage(`✓ ${item.name} berhasil ditambahkan ke keranjang!`);
    setTimeout(() => setToastMessage(null), 2200);
  };

  return (
    <div className="products-page-container">
      <div className="products-header">
        <h1 className="products-title">Menu EtaCafe</h1>
        <div className="category-tabs">
          <button
            key="all"
            type="button"
            className={selectedCategoryId === "all" ? "category-tab-btn active" : "category-tab-btn"}
            onClick={() => setSelectedCategoryId("all")}
          >
            Semua Menu
          </button>
          {[
            { id: 1, name: "Kopi & Minuman" },
            { id: 2, name: "Makanan Utama" },
            { id: 3, name: "Camilan & Snack" },
            { id: 4, name: "Dessert & Penutup" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={selectedCategoryId === cat.id ? "category-tab-btn active" : "category-tab-btn"}
              onClick={() => setSelectedCategoryId(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="search-bar-row">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Cari menu kopi atau makanan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <span className="menu-count-text">
          Menampilkan <strong>{filteredItems.length}</strong> menu
        </span>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          Mengambil menu dari database...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          Tidak ada menu yang sesuai dengan kategori atau pencarian.
        </div>
      ) : (
        <div className="products-menu-list">
          {filteredItems.map((item) => {
            const catName = categoryMap[item.category_id] || "Menu";

            return (
              <div
                key={item.id}
                className="menu-card"
                onClick={() => navigate(`/pelanggan/detail/${item.id}`)}
              >
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="menu-card-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600";
                  }}
                />
                <div className="menu-card-body">
                  <div>
                    <span className="menu-card-cat-badge">{catName}</span>
                    <h3 className="menu-card-name">{item.name}</h3>
                    <p className="menu-card-desc">{item.description}</p>
                  </div>
                  <div className="menu-card-footer">
                    <span className="menu-card-price">{formatRupiah(item.price)}</span>
                    {item.is_available ? (
                      <button
                        type="button"
                        className="btn-add-cart"
                        onClick={(e) => handleAddToCart(e, item)}
                      >
                        Add to Cart
                      </button>
                    ) : (
                      <span className="unavailable-tag">Habis / Tidak Tersedia</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toastMessage && <div className="products-toast">{toastMessage}</div>}
    </div>
  );
}
