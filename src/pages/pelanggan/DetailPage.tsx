// ============================================================
// HALAMAN : DetailPage
// PERAN   : pelanggan
// ROUTE   : /pelanggan/detail/:id
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PelangganAPI, MenuItemData } from '../../api/pelanggan';
import { useCart, formatRupiah } from '../../context/CartContext';
import './DetailPage.css';

const FALLBACK_MENUS: Record<number, MenuItemData> = {
  1: {
    id: 1,
    name: 'Eta Signature Kopi Aren',
    category_id: 1,
    price: 18000,
    description: 'Espresso double shot dipadukan susu segar creamy dan gula aren organik khas perkebunan lokal Sulawesi Selatan. Diracik khusus oleh barista EtaCafe.',
    image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=1200&q=85',
    is_available: true,
  },
  2: {
    id: 2,
    name: 'Vanilla Caramel Macchiato',
    category_id: 1,
    price: 24000,
    description: 'Sirup vanila lembut, steamed milk, shot espresso pekat dengan saus karamel manis.',
    image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=1200&q=85',
    is_available: true,
  },
  3: {
    id: 3,
    name: 'Matcha Green Tea Latte',
    category_id: 1,
    price: 22000,
    description: 'Matcha Uji Jepang premium dipadukan susu hangat atau dingin menyegarkan.',
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=1200&q=85',
    is_available: true,
  },
  4: {
    id: 4,
    name: 'Nasi Goreng Spesial EtaCafe',
    category_id: 2,
    price: 28000,
    description: 'Nasi goreng harum rempah nusantara dengan suwiran ayam, bakso, telur mata sapi, acar, dan kerupuk.',
    image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=1200&q=85',
    is_available: true,
  },
  5: {
    id: 5,
    name: 'Ayam Geprek Sambal Korek',
    category_id: 2,
    price: 25000,
    description: 'Ayam krispi gurih digeprek sambal korek pedas segar dengan nasi putih pulen.',
    image_url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=1200&q=85',
    is_available: true,
  },
  6: {
    id: 6,
    name: 'Spaghetti Carbonara Creamy',
    category_id: 2,
    price: 35000,
    description: 'Pasta spaghetti al dente saus keju parmesan creamy, beef bacon renyah, dan taburan oregano.',
    image_url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=1200&q=85',
    is_available: true,
  },
  7: {
    id: 7,
    name: 'Sop Iga Sapi Kuah Gurih',
    category_id: 2,
    price: 48000,
    description: 'Iga sapi empuk kuah rempah bening gurih bertabur daun seledri dan emping.',
    image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=1200&q=85',
    is_available: false,
  },
  8: {
    id: 8,
    name: 'Tahu Lada Garam Crispy',
    category_id: 3,
    price: 16000,
    description: 'Tahu sutra dipotong dadu digoreng garing dengan tumisan bawang putih dan irisan cabe rawit.',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=85',
    is_available: true,
  },
  9: {
    id: 9,
    name: 'French Fries Truffle Herb',
    category_id: 3,
    price: 20000,
    description: 'Kentang goreng renyah bumbu truffle aromatik dan taburan keju parmesan.',
    image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=1200&q=85',
    is_available: true,
  },
  10: {
    id: 10,
    name: 'Croffle Choco Almond',
    category_id: 4,
    price: 22000,
    description: 'Croissant waffle renyah berlapis saus dark cokelat Belgia dan kacang almond panggang.',
    image_url: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=1200&q=85',
    is_available: true,
  },
};

export default function DetailPage() {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<MenuItemData | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchDetail() {
      setLoading(true);
      try {
        const data = await PelangganAPI.getDetailMenu(Number(id));
        if (isMounted) setItem(data);
      } catch (err) {
        console.warn('Gagal memanggil API getDetailMenu, menggunakan fallback tabel menu_items:', err);
        if (isMounted) {
          setItem(FALLBACK_MENUS[Number(id)] || FALLBACK_MENUS[1]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleAdd = () => {
    if (!item) return;
    addToCart(item, quantity);
    setToastMessage(`✓ ${quantity}x ${item.name} berhasil ditambahkan!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  return (
    <div className="detail-page-container">
        {/* Tombol kembali overlay */}
        <button
          type="button"
          className="btn-back-overlay"
          onClick={() => navigate('/pelanggan/products')}
        >
          ← Kembali ke Menu
        </button>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            Memuat detail menu...
          </div>
        ) : item ? (
          <div className="detail-hero-full">
            <img
              src={item.image_url}
              alt={item.name}
              className="hero-img"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=85';
              }}
            />

            {!item.is_available && (
              <div className="unavail-badge">Menu Sedang Habis</div>
            )}

            <div className="hero-overlay">
              <div className="hero-info-left">
                <h1 className="hero-product-name">{item.name}</h1>
                <p className="hero-product-desc">{item.description}</p>
              </div>

              <div className="hero-info-right">
                <div className="hero-price">{formatRupiah(item.price)}</div>

                <div className="qty-row">
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    −
                  </button>
                  <span className="qty-num">{quantity}</span>
                  <button
                    type="button"
                    className="qty-btn"
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  className="btn-add-to-cart"
                  disabled={!item.is_available}
                  onClick={handleAdd}
                >
                  {item.is_available ? 'Add to Cart' : 'Stok Habis'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="error-state">Menu tidak ditemukan.</div>
        )}
        {/* Toast notification */}
        {toastMessage && <div className="products-toast">{toastMessage}</div>}
      </div>
  );
}
