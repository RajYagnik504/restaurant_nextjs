'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { placeOrder } from './actions';

export default function MenuClient({ initialCategories, table }: { initialCategories: any[], table?: string }) {
  const router = useRouter();
  const [lang, setLang] = useState('en');
  const [activeCat, setActiveCat] = useState(initialCategories[0]?.id);
  const [cart, setCart] = useState<{[key: number]: { item: any, qty: number }}>({});
  const [checkoutMode, setCheckoutMode] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    const cartArray = Object.values(cart);
    
    const result = await placeOrder({
      cart: cartArray,
      customerName,
      customerMobile,
      table
    });

    setIsSubmitting(false);

    if (result.success) {
      setCart({});
      setCheckoutMode(false);
      router.push(`/order/${result.orderId}`);
    } else {
      alert('Error placing order: ' + result.error);
    }
  };
  
  useEffect(() => {
    const savedLang = localStorage.getItem('menu_lang');
    if (savedLang) setLang(savedLang);
  }, []);

  const changeLang = (l: string) => {
    setLang(l);
    localStorage.setItem('menu_lang', l);
  };

  const getTranslatedName = (entity: any) => {
    if (lang === 'hi' && entity.name_hi) return entity.name_hi;
    if (lang === 'gu' && entity.name_gu) return entity.name_gu;
    return entity.name;
  };

  const getTranslatedDesc = (entity: any) => {
    if (lang === 'hi' && entity.desc_hi) return entity.desc_hi;
    if (lang === 'gu' && entity.desc_gu) return entity.desc_gu;
    return entity.description;
  };

  const updateCart = (item: any, delta: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      const currentQty = newCart[item.id]?.qty || 0;
      const newQty = currentQty + delta;
      
      if (newQty <= 0) {
        delete newCart[item.id];
      } else {
        newCart[item.id] = { item, qty: newQty };
      }
      return newCart;
    });
  };

  const cartItemsCount = Object.values(cart).reduce((sum, c) => sum + c.qty, 0);
  const cartTotal = Object.values(cart).reduce((sum, c) => sum + (c.item.price * c.qty), 0);

  const activeCategoryData = initialCategories.find(c => c.id === activeCat);

  return (
    <>
      <div style={{ padding: '10px 15px', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: 'white' }}>
        <button onClick={() => changeLang('en')} style={{ fontWeight: lang === 'en' ? 'bold' : 'normal', background: 'none', border: 'none' }}>EN</button>
        <button onClick={() => changeLang('hi')} style={{ fontWeight: lang === 'hi' ? 'bold' : 'normal', background: 'none', border: 'none' }}>HI</button>
        <button onClick={() => changeLang('gu')} style={{ fontWeight: lang === 'gu' ? 'bold' : 'normal', background: 'none', border: 'none' }}>GU</button>
      </div>

      <div className="category-tabs">
        {initialCategories.map(cat => (
          <button 
            key={cat.id} 
            className={`category-tab ${activeCat === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCat(cat.id)}
          >
            {getTranslatedName(cat)}
          </button>
        ))}
      </div>

      <div className="menu-section">
        {activeCategoryData?.items.map((item: any) => {
          const qty = cart[item.id]?.qty || 0;
          return (
            <div key={item.id} className="menu-item-card">
              <div className={`food-type-indicator food-type-${item.food_type === 'nonveg' ? 'nonveg' : item.food_type === 'egg' ? 'egg' : 'veg'}`}></div>
              <div className="item-details">
                <h3 className="item-name">{getTranslatedName(item)}</h3>
                {getTranslatedDesc(item) && <p className="item-desc">{getTranslatedDesc(item)}</p>}
                <div className="item-price">₹{item.price}</div>
              </div>
              <div className="item-actions">
                {item.is_combo && <span style={{ fontSize: '0.7rem', background: '#fef08a', padding: '2px 5px', borderRadius: '4px', marginBottom: '10px' }}>COMBO</span>}
                {qty === 0 ? (
                  <button className="add-btn" onClick={() => updateCart(item, 1)}>ADD</button>
                ) : (
                  <div className="qty-control">
                    <button className="qty-btn" onClick={() => updateCart(item, -1)}>-</button>
                    <span className="qty-value">{qty}</span>
                    <button className="qty-btn" onClick={() => updateCart(item, 1)}>+</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {cartItemsCount > 0 && !checkoutMode && (
        <div className="cart-bar" onClick={() => setCheckoutMode(true)}>
          <div className="cart-bar-left">
            {cartItemsCount} {cartItemsCount === 1 ? 'Item' : 'Items'} | ₹{cartTotal.toFixed(2)}
          </div>
          <div className="cart-bar-right">
            View Cart <i className="fa-solid fa-arrow-right"></i>
          </div>
        </div>
      )}

      {checkoutMode && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: '#f9fafb', zIndex: 1000, overflowY: 'auto'
        }}>
          <header style={{ padding: '15px 20px', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '15px', position: 'sticky', top: 0 }}>
            <i className="fa-solid fa-arrow-left" style={{ cursor: 'pointer', fontSize: '1.2rem' }} onClick={() => setCheckoutMode(false)}></i>
            <h1 style={{ margin: 0, fontSize: '1.2rem' }}>Checkout</h1>
          </header>
          <div style={{ padding: '15px' }}>
            <div className="card" style={{ background: 'white', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0' }}>Order Summary</h3>
              {Object.values(cart).map((c: any) => (
                <div key={c.item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div>
                    <div>{getTranslatedName(c.item)} x {c.qty}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>₹{c.item.price} each</div>
                  </div>
                  <div style={{ fontWeight: 600 }}>₹{(c.item.price * c.qty).toFixed(2)}</div>
                </div>
              ))}
              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '15px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' }}>
                <div>Total</div>
                <div>₹{cartTotal.toFixed(2)}</div>
              </div>
            </div>

            <div className="card" style={{ background: 'white', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0' }}>Your Details (Optional)</h3>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Mobile Number</label>
                <input 
                  type="tel" 
                  placeholder="e.g. 9876543210" 
                  style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
                  value={customerMobile}
                  onChange={e => setCustomerMobile(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Rahul" 
                  style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }}
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                />
              </div>
            </div>

            <button 
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              style={{ width: '100%', padding: '15px', background: isSubmitting ? '#94a3b8' : 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1.1rem', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
              {isSubmitting ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
