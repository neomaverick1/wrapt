/* Juniper & Co. demo shop. A plain single-page site: hash routes, a cart in localStorage,
   and a small bridge that lights up native features when the site runs inside the Wrapt app. */
(function () {
  'use strict';

  var PRODUCTS = [
    { id: 'monstera', name: 'Monstera Deliciosa', latin: 'Monstera deliciosa', price: 48, img: 'img/monstera.jpg', light: 'Bright, indirect', water: 'Every 1–2 weeks', pet: false, tags: ['easy', 'large'], rating: 4.9, reviews: 412, desc: 'The split-leaf favourite. Grows fast, forgives the odd missed watering and makes any corner feel like a jungle.' },
    { id: 'fiddle-leaf-fig', name: 'Fiddle Leaf Fig', latin: 'Ficus lyrata', price: 65, img: 'img/fiddle-leaf-fig.jpg', light: 'Bright, indirect', water: 'Weekly', pet: false, tags: ['large'], rating: 4.6, reviews: 288, desc: 'Big violin-shaped leaves on a tall stem. Loves a bright window and a steady routine.' },
    { id: 'snake-plant', name: 'Snake Plant', latin: 'Dracaena trifasciata', price: 34, img: 'img/snake-plant.jpg', light: 'Low to bright', water: 'Every 2–3 weeks', pet: false, tags: ['easy', 'low-light'], rating: 4.9, reviews: 655, desc: 'Practically indestructible. Upright striped leaves that cope with low light and long holidays.' },
    { id: 'zz-plant', name: 'ZZ Plant', latin: 'Zamioculcas zamiifolia', price: 38, img: 'img/zz-plant.jpg', light: 'Low to medium', water: 'Every 2–3 weeks', pet: false, tags: ['easy', 'low-light'], rating: 4.8, reviews: 377, desc: 'Glossy leaves that look polished all year. Thrives on neglect and office lighting.' },
    { id: 'pothos', name: 'Golden Pothos', latin: 'Epipremnum aureum', price: 29, img: 'img/pothos.jpg', light: 'Low to bright', water: 'Weekly', pet: false, tags: ['easy', 'low-light'], rating: 4.8, reviews: 520, desc: 'A trailing classic in a hanging pot. Grows long vines you can let fall or train along a shelf.' },
    { id: 'spider-plant', name: 'Spider Plant', latin: 'Chlorophytum comosum', price: 22, img: 'img/spider-plant.jpg', light: 'Medium to bright', water: 'Weekly', pet: true, tags: ['easy', 'pet-friendly'], rating: 4.7, reviews: 301, desc: 'Arching striped leaves and little plantlets you can root and share. Safe for cats and dogs.' },
    { id: 'aloe', name: 'Aloe Vera', latin: 'Aloe barbadensis', price: 24, img: 'img/aloe.jpg', light: 'Bright', water: 'Every 3 weeks', pet: false, tags: ['easy'], rating: 4.7, reviews: 214, desc: 'A sunny-window succulent in a concrete pot. Water rarely and let the soil dry fully.' },
    { id: 'haworthia', name: 'Zebra Haworthia', latin: 'Haworthiopsis attenuata', price: 16, img: 'img/haworthia.jpg', light: 'Bright', water: 'Every 3 weeks', pet: true, tags: ['easy', 'pet-friendly'], rating: 4.8, reviews: 189, desc: 'A tiny striped succulent for desks and shelves. Pet friendly and very forgiving.' },
    { id: 'bonsai', name: 'Ginseng Ficus Bonsai', latin: 'Ficus microcarpa', price: 42, img: 'img/bonsai.jpg', light: 'Bright, indirect', water: 'Twice a week', pet: false, tags: ['gift'], rating: 4.6, reviews: 96, outOfStock: true, desc: 'A sculptural little tree on chunky roots. The easiest way into bonsai.' },
    { id: 'velvet-philodendron', name: 'Velvet Philodendron', latin: 'Philodendron verrucosum', price: 56, img: 'img/velvet-philodendron.jpg', light: 'Medium, indirect', water: 'Weekly', pet: false, tags: ['large'], rating: 4.7, reviews: 77, desc: 'Velvety heart-shaped leaves with bright veins. A collector’s plant that is easier than it looks.' },
    { id: 'lucky-bamboo', name: 'Lucky Bamboo', latin: 'Dracaena sanderiana', price: 19, img: 'img/lucky-bamboo.jpg', light: 'Low to medium', water: 'Top up water', pet: false, tags: ['easy', 'low-light', 'gift'], rating: 4.5, reviews: 143, desc: 'Grows in water or soil. A classic gift said to bring good fortune.' },
    { id: 'cactus', name: 'Blue Columnar Cactus', latin: 'Pilosocereus', price: 21, img: 'img/cactus.jpg', light: 'Full sun', water: 'Monthly', pet: true, tags: ['pet-friendly'], rating: 4.6, reviews: 120, desc: 'A blue-green column in a terracotta pot. Give it your sunniest spot and forget about it.' },
  ];
  var FILTERS = [
    { id: 'all', label: 'All plants' },
    { id: 'easy', label: 'Easy care' },
    { id: 'low-light', label: 'Low light' },
    { id: 'pet-friendly', label: 'Pet friendly' },
    { id: 'large', label: 'Statement size' },
    { id: 'gift', label: 'Gifts' },
  ];
  var SIZES = [
    { id: 's', label: 'Small', note: '4″ pot', add: -8 },
    { id: 'm', label: 'Medium', note: '6″ pot', add: 0 },
    { id: 'l', label: 'Large', note: '10″ pot', add: 22 },
  ];
  var FREE_SHIPPING = 75;
  var SHIPPING = 7.95;
  var SITE_URL = 'https://neomaverick1.github.io/wrapt/site/';

  // ---------- native bridge ----------
  var params = new URLSearchParams(location.search);
  var Bridge = {
    inApp: !!window.ReactNativeWebView || params.has('app'),
    post: function (msg) {
      try {
        if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
        else if (window.parent !== window) window.parent.postMessage({ wrapt: msg }, location.origin);
      } catch (e) { /* not in the app */ }
    },
    receive: function (msg) {
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === 'navigate' && typeof msg.path === 'string') go(msg.path);
      if (msg.type === 'hello') { document.documentElement.classList.add('in-app'); Bridge.inApp = true; Bridge.platform = msg.platform; announce(); }
    },
  };
  window.WraptBridge = Bridge;
  window.addEventListener('message', function (e) {
    if (e.source === window.parent && e.origin === location.origin && e.data && e.data.wraptCmd) Bridge.receive(e.data.wraptCmd);
  });
  if (Bridge.inApp) document.documentElement.classList.add('in-app');

  // ---------- state ----------
  function load(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; } }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  var cart = load('juniper.cart', []);
  var orders = load('juniper.orders', []);
  var filter = 'all';

  function byId(id) { for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i]; return null; }
  function money(n) { return '$' + n.toFixed(2); }
  function cartCount() { return cart.reduce(function (s, l) { return s + l.qty; }, 0); }
  function subtotal() { return cart.reduce(function (s, l) { return s + l.price * l.qty; }, 0); }
  function setCart(next) {
    cart = next;
    save('juniper.cart', cart);
    var n = cartCount();
    var badge = document.querySelector('.cart-count');
    badge.textContent = n;
    badge.hidden = !n;
    Bridge.post({ type: 'cart', count: n });
  }

  function toast(text) {
    var t = document.getElementById('toast');
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { t.classList.remove('show'); }, 1800);
  }

  // ---------- views ----------
  function card(p) {
    return '<a class="card" href="#/product/' + p.id + '">' +
      '<div class="img"><img loading="lazy" src="' + p.img + '" alt="' + p.name + '"/>' +
      (p.outOfStock ? '<span class="badge clay">Back soon</span>' : p.pet ? '<span class="badge">Pet friendly</span>' : '') + '</div>' +
      '<div class="body"><span class="name">' + p.name + '</span><span class="meta">★ ' + p.rating + ' · ' + p.light + '</span>' +
      '<div class="row"><span class="price">' + money(p.price) + '</span>' +
      (p.outOfStock ? '' : '<button class="add" data-add="' + p.id + '" aria-label="Add ' + p.name + ' to cart">+</button>') + '</div></div></a>';
  }

  function home() {
    var best = PRODUCTS.filter(function (p) { return p.reviews > 280; });
    return '<section class="hero"><img src="img/hero.jpg" alt="A monstera next to a white chair"/>' +
      '<div class="hero-text"><h1>Plants that make<br/>a house a home</h1><p>Healthy, locally grown houseplants delivered across Chicagoland in two days.</p>' +
      '<a class="btn light" href="#/shop">Shop plants</a></div></section>' +
      '<div class="perks"><div class="perk"><strong>Free delivery</strong>on orders over $75</div><div class="perk"><strong>30-day guarantee</strong>happy plant or a new one</div><div class="perk"><strong>Plant doctor</strong>send a photo, get advice</div></div>' +
      '<div class="section-head"><h2>Bestsellers</h2><a href="#/shop">See all</a></div>' +
      '<div class="scroller">' + best.map(card).join('') + '</div>' +
      '<div class="section-head"><h2>Easy care</h2><a href="#/shop/easy">See all</a></div>' +
      '<div class="grid">' + PRODUCTS.filter(function (p) { return p.tags.indexOf('easy') >= 0; }).slice(0, 4).map(card).join('') + '</div>';
  }

  function shop(f) {
    filter = f || filter || 'all';
    var list = PRODUCTS.filter(function (p) { return filter === 'all' || p.tags.indexOf(filter) >= 0; });
    return '<h1 class="page-title">Shop plants</h1><p class="lead">' + list.length + ' plants, grown in Illinois and shipped in recyclable packaging.</p>' +
      '<div class="chips">' + FILTERS.map(function (x) { return '<button class="chip' + (x.id === filter ? ' on' : '') + '" data-filter="' + x.id + '">' + x.label + '</button>'; }).join('') + '</div>' +
      '<div class="grid">' + list.map(card).join('') + '</div>';
  }

  function product(id) {
    var p = byId(id);
    if (!p) return notFound();
    var size = product.size && product.size.id === id ? product.size.value : 'm';
    var qty = product.qty && product.qty.id === id ? product.qty.value : 1;
    var s = SIZES.filter(function (x) { return x.id === size; })[0];
    return '<div class="product"><div class="photo"><img src="' + p.img + '" alt="' + p.name + '"/></div><div>' +
      '<h1>' + p.name + '</h1><p class="latin">' + p.latin + ' · ★ ' + p.rating + ' (' + p.reviews + ' reviews)</p>' +
      '<div class="price" style="font-size:24px">' + money(p.price + s.add) + '</div>' +
      '<div class="care"><div><strong>Light</strong>' + p.light + '</div><div><strong>Water</strong>' + p.water + '</div><div><strong>Pets</strong>' + (p.pet ? 'Safe' : 'Keep away') + '</div></div>' +
      (p.outOfStock
        ? '<div class="note">Sold out right now. New stock arrives this week.</div><button class="btn clay block" data-notify="' + p.id + '">🔔 Notify me when it’s back</button>'
        : '<div class="sizes">' + SIZES.map(function (x) { return '<button class="size' + (x.id === size ? ' on' : '') + '" data-size="' + x.id + '" data-pid="' + p.id + '">' + x.label + '<small>' + x.note + '</small></button>'; }).join('') + '</div>' +
          '<div class="buy"><div class="qty"><button data-qty="-1" data-pid="' + p.id + '" aria-label="Fewer">−</button><span>' + qty + '</span><button data-qty="1" data-pid="' + p.id + '" aria-label="More">+</button></div>' +
          '<button class="btn block" data-buy="' + p.id + '">Add to cart · ' + money((p.price + s.add) * qty) + '</button></div>') +
      '<div class="share-row"><button class="btn ghost" data-share="' + p.id + '">Share this plant</button></div>' +
      '<p class="desc">' + p.desc + '</p></div></div>';
  }

  function cartView() {
    if (!cart.length) return '<h1 class="page-title">Your cart</h1><div class="panel success"><p>Your cart is empty.</p><a class="btn" href="#/shop">Browse plants</a></div>';
    var sub = subtotal();
    var ship = sub >= FREE_SHIPPING ? 0 : SHIPPING;
    return '<h1 class="page-title">Your cart</h1><p class="lead">' + (sub >= FREE_SHIPPING ? 'You get free delivery.' : 'Add ' + money(FREE_SHIPPING - sub) + ' more for free delivery.') + '</p>' +
      '<div class="panel">' + cart.map(function (l, i) {
        var p = byId(l.id);
        return '<div class="line"><img src="' + p.img + '" alt=""/><div class="info"><strong>' + p.name + '</strong><small>' + l.size + ' · ' + money(l.price) + '</small></div>' +
          '<div class="qty"><button data-line="' + i + '" data-delta="-1" aria-label="Fewer">−</button><span>' + l.qty + '</span><button data-line="' + i + '" data-delta="1" aria-label="More">+</button></div></div>';
      }).join('') + '</div>' +
      '<div class="panel totals" style="margin-top:14px"><div><span>Subtotal</span><span>' + money(sub) + '</span></div><div><span>Delivery</span><span>' + (ship ? money(ship) : 'Free') + '</span></div>' +
      '<div class="total"><span>Total</span><span>' + money(sub + ship) + '</span></div></div>' +
      '<a class="btn block" style="margin-top:14px" href="#/checkout">Checkout</a>';
  }

  function checkout() {
    if (!cart.length) return cartView();
    var sub = subtotal();
    var total = sub + (sub >= FREE_SHIPPING ? 0 : SHIPPING);
    return '<h1 class="page-title">Checkout</h1><p class="lead">Demo checkout: nothing is charged.</p><form class="panel" id="checkout">' +
      '<div class="field"><label for="name">Name</label><input id="name" value="Alex Rivera" required/></div>' +
      '<div class="field"><label for="email">Email</label><input id="email" type="email" value="alex@example.com" required/></div>' +
      '<div class="field"><label for="addr">Delivery address</label><input id="addr" value="845 W Fulton Market, Chicago, IL" required/></div>' +
      '<button class="btn block" type="submit">Place order · ' + money(total) + '</button></form>';
  }

  function orderView(id) {
    var o = orders.filter(function (x) { return x.id === id; })[0];
    if (!o) return notFound();
    return '<div class="panel success"><div class="tick">✓</div><h1 class="page-title">Thank you!</h1><p class="lead">Order ' + o.id + ' · ' + o.items + ' plant' + (o.items === 1 ? '' : 's') + ' · ' + money(o.total) + '</p>' +
      '<p>Your plants are being packed. ' + (Bridge.inApp ? 'We’ll send a notification when they ship.' : 'We’ll email you when they ship.') + '</p>' +
      '<a class="btn" href="#/shop">Keep shopping</a></div>';
  }

  function account() {
    return '<h1 class="page-title">Hi, Alex</h1><p class="lead">Member since 2025 · ' + orders.length + ' order' + (orders.length === 1 ? '' : 's') + '</p>' +
      '<div class="panel"><h3>Plant doctor</h3><p class="lead" style="margin:6px 0 12px">Send a photo of a plant that looks unhappy and our growers reply within a day.</p>' +
      '<label class="upload" id="upload-zone"><input type="file" accept="image/*" capture="environment" id="photo" hidden/>' +
      '<strong>📷 Take or choose a photo</strong><div class="lead" style="margin:4px 0 0;font-size:13px">JPG or PNG, up to 10 MB</div><div id="preview"></div></label></div>' +
      '<div class="panel" style="margin-top:14px"><h3>Your orders</h3>' + (orders.length ? orders.map(function (o) {
        return '<div class="line"><div class="info"><strong>' + o.id + '</strong><small>' + o.date + ' · ' + o.items + ' plants</small></div><span class="price">' + money(o.total) + '</span></div>';
      }).join('') : '<p class="lead" style="margin:8px 0 0">No orders yet.</p>') + '</div>' +
      '<p class="lead app-only" style="margin-top:14px;font-size:13px">You’re using the Juniper app. Account is protected with Face ID / fingerprint when you open it.</p>';
  }

  function care() {
    var guides = [
      { img: 'img/leaves.jpg', t: 'Watering without worry', d: 'Check the top two inches of soil with a finger. Dry? Water until it runs out of the drainage hole. Damp? Wait.' },
      { img: 'img/calathea.jpg', t: 'Reading the leaves', d: 'Yellow and soft means too much water. Crispy brown edges mean dry air or too little water.' },
      { img: 'img/shelf.jpg', t: 'Finding the right light', d: 'Most houseplants love bright light that never hits them directly. A sheer curtain works wonders.' },
      { img: 'img/soil.jpg', t: 'When to repot', d: 'Roots circling the pot or poking out of the bottom? Move up one pot size in spring.' },
    ];
    return '<h1 class="page-title">Plant care</h1><p class="lead">Short guides from our growers.</p>' +
      guides.map(function (g) { return '<div class="panel guide" style="margin-bottom:12px"><img src="' + g.img + '" alt=""/><div><h3>' + g.t + '</h3><p class="lead" style="margin:6px 0 0">' + g.d + '</p></div></div>'; }).join('') +
      '<a class="btn ghost" href="https://en.wikipedia.org/wiki/Houseplant" target="_blank" rel="noopener">Read more about houseplants ↗</a>';
  }

  function notFound() { return '<div class="panel success"><h1 class="page-title">Page not found</h1><a class="btn" href="#/">Go home</a></div>'; }

  // ---------- router ----------
  var TITLES = { '': 'Juniper & Co.', shop: 'Shop', product: 'Plant', cart: 'Cart', checkout: 'Checkout', order: 'Order placed', account: 'Account', care: 'Plant care' };
  function go(path) { location.hash = '#' + (path.charAt(0) === '/' ? path : '/' + path); }
  function current() { return (location.hash || '#/').slice(1) || '/'; }

  function announce() {
    var path = current();
    var parts = path.split('/').filter(Boolean);
    var title = parts[0] === 'product' && byId(parts[1]) ? byId(parts[1]).name : TITLES[parts[0] || ''] || 'Juniper & Co.';
    Bridge.post({ type: 'route', path: path, title: title, canGoBack: parts.length > 1 || ['checkout', 'order'].indexOf(parts[0]) >= 0 });
    Bridge.post({ type: 'cart', count: cartCount() });
  }

  function render() {
    var parts = current().split('/').filter(Boolean);
    var view = parts[0] || '';
    var html =
      view === '' ? home() :
      view === 'shop' ? shop(parts[1]) :
      view === 'product' ? product(parts[1]) :
      view === 'cart' ? cartView() :
      view === 'checkout' ? checkout() :
      view === 'order' ? orderView(parts[1]) :
      view === 'account' ? account() :
      view === 'care' ? care() : notFound();
    var main = document.getElementById('main');
    main.innerHTML = html;
    document.title = (view === '' ? '' : (TITLES[view] || '') + ' · ') + 'Juniper & Co.';
    window.scrollTo(0, 0);
    announce();
  }

  // ---------- actions ----------
  function addToCart(p, sizeId, qty) {
    var s = SIZES.filter(function (x) { return x.id === sizeId; })[0];
    var price = p.price + s.add;
    var next = cart.slice();
    var found = next.filter(function (l) { return l.id === p.id && l.size === s.label; })[0];
    if (found) found.qty += qty; else next.push({ id: p.id, size: s.label, price: price, qty: qty });
    setCart(next);
    Bridge.post({ type: 'haptic', kind: 'success' });
    toast('Added ' + p.name);
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('button, a');
    if (!t) return;
    var d = t.dataset;
    if (d.add) { e.preventDefault(); addToCart(byId(d.add), 'm', 1); }
    else if (d.filter) { filter = d.filter; go('/shop/' + d.filter); }
    else if (d.size) { product.size = { id: d.pid, value: d.size }; render(); }
    else if (d.qty) { var q = (product.qty && product.qty.id === d.pid ? product.qty.value : 1) + Number(d.qty); product.qty = { id: d.pid, value: Math.max(1, Math.min(9, q)) }; render(); }
    else if (d.buy) { addToCart(byId(d.buy), product.size && product.size.id === d.buy ? product.size.value : 'm', product.qty && product.qty.id === d.buy ? product.qty.value : 1); product.qty = null; render(); }
    else if (d.line) {
      var next = cart.slice(); var l = next[Number(d.line)]; l.qty += Number(d.delta);
      setCart(next.filter(function (x) { return x.qty > 0; })); render();
    } else if (d.share) {
      var p = byId(d.share); var url = SITE_URL + '#/product/' + p.id;
      if (Bridge.inApp) Bridge.post({ type: 'share', title: p.name, text: p.name + ' from Juniper & Co.', url: url });
      else if (navigator.share) navigator.share({ title: p.name, url: url }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast('Link copied'); });
    } else if (d.notify) {
      var item = byId(d.notify);
      if (Bridge.inApp) {
        Bridge.post({ type: 'notify', title: 'Back in stock 🌱', body: item.name + ' is available again. Tap to grab one.', delaySec: 8, path: '/product/' + item.id });
        toast('We’ll notify you on this phone');
      } else toast('We’ll email you when it’s back');
    }
  });

  document.addEventListener('submit', function (e) {
    if (e.target.id !== 'checkout') return;
    e.preventDefault();
    var sub = subtotal();
    var o = { id: 'JN-' + String(Date.now()).slice(-5), items: cartCount(), total: sub + (sub >= FREE_SHIPPING ? 0 : SHIPPING), date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
    orders = [o].concat(orders);
    save('juniper.orders', orders);
    setCart([]);
    Bridge.post({ type: 'haptic', kind: 'success' });
    Bridge.post({ type: 'notify', title: 'Your plants have shipped 🚚', body: 'Order ' + o.id + ' is on its way. Arriving in 2 days.', delaySec: 12, path: '/account' });
    go('/order/' + o.id);
  });

  document.addEventListener('change', function (e) {
    if (e.target.id !== 'photo' || !e.target.files || !e.target.files[0]) return;
    var url = URL.createObjectURL(e.target.files[0]);
    document.getElementById('preview').innerHTML = '<img src="' + url + '" alt="Your photo"/><p class="lead" style="margin:8px 0 0">Sent to our growers. We’ll reply within a day.</p>';
  });

  window.addEventListener('hashchange', render);
  setCart(cart);
  render();
})();
