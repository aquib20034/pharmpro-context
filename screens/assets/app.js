/* PharmaPro mockup shell: injects sidebar/topbar, wires tabs, modals, drawers, toasts, palette, shortcuts. */
(function () {
  const I = {
    dash: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1"/><rect x="1.5" y="9" width="5.5" height="5.5" rx="1"/><rect x="9" y="9" width="5.5" height="5.5" rx="1"/></svg>',
    pos: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 5h12l-1 8H3L2 5z"/><path d="M5.5 5V3.5a2.5 2.5 0 0 1 5 0V5"/></svg>',
    sales: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3 2h10v12l-2-1.2L9 14l-2-1.2L5 14l-2-1.2z"/><path d="M5.5 6h5M5.5 8.5h5"/></svg>',
    buy: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 3h2l1.5 7.5h6.5L14 5H5"/><circle cx="6.5" cy="13" r="1"/><circle cx="11.5" cy="13" r="1"/></svg>',
    inv: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 5l6-3 6 3v6l-6 3-6-3z"/><path d="M2 5l6 3 6-3M8 8v6"/></svg>',
    prod: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="6" width="12" height="5" rx="2.5" transform="rotate(-35 8 8.5)"/><path d="M8 5.5l1.5 4"/></svg>',
    partner: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="6" cy="5.5" r="2.5"/><path d="M1.5 13.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4"/><path d="M11 3.5a2.5 2.5 0 0 1 0 4M12.5 9.7c1.3.5 2 1.6 2 3.3"/></svg>',
    acc: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M5 5.5h6M5 8h2M9 8h2M5 10.5h2M9 10.5h2"/></svg>',
    rep: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 13.5h12"/><path d="M3.5 11V7M7 11V4M10.5 11V8.5M14 11V3"/></svg>',
    set: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="2.2"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"/></svg>',
    bell: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M3.5 11.5h9l-1-1.5V7a3.5 3.5 0 0 0-7 0v3z"/><path d="M6.5 13.5a1.5 1.5 0 0 0 3 0"/></svg>',
    help: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="6.2"/><path d="M6.2 6.3A1.9 1.9 0 1 1 8.6 8.1C8.1 8.4 8 8.8 8 9.3"/><circle cx="8" cy="11.6" r=".5" fill="currentColor"/></svg>',
    menu: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2.5 4h11M2.5 8h11M2.5 12h11"/></svg>',
    search: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>',
    x: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
    branch: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 14V6l6-3.5L14 6v8"/><path d="M6 14v-4h4v4"/></svg>',
    plat: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="4" width="12" height="9" rx="1.5"/><path d="M5 4V3h6v1M5 8h6M5 10.5h3"/></svg>',
  };
  window.PPIcons = I;

  const NAV = [
    { g: 'Operate' },
    { k: 'dashboard', t: 'Dashboard', h: 'dashboard.html', i: 'dash' },
    { k: 'pos', t: 'Point of Sale', h: 'pos.html', i: 'pos', kbd: 'F2' },
    { k: 'sales', t: 'Sales', h: 'sales.html', i: 'sales' },
    { k: 'purchases', t: 'Purchases', h: 'purchases.html', i: 'buy' },
    { k: 'approvals', t: 'Approvals', h: 'approvals.html', i: 'acc', pill: '2' },
    { g: 'Stock' },
    { k: 'inventory', t: 'Inventory', h: 'inventory.html', i: 'inv', pill: '7' },
    { k: 'products', t: 'Products', h: 'products.html', i: 'prod' },
    { k: 'manufacturers', t: 'Manufacturers', h: 'manufacturers.html', i: 'prod' },
    { k: 'stocktake', t: 'Stocktake', h: 'stocktake.html', i: 'inv' },
    { g: 'Partners & money' },
    { k: 'customers', t: 'Customers', h: 'customers.html', i: 'partner' },
    { k: 'suppliers', t: 'Suppliers', h: 'suppliers.html', i: 'partner' },
    { k: 'accounting', t: 'Accounting', h: 'accounting.html', i: 'acc' },
    { k: 'reports', t: 'Reports', h: 'reports.html', i: 'rep' },
    { g: 'System' },
    { k: 'settings', t: 'Settings', h: 'settings.html', i: 'set' },
  ];

  const PLATFORM_NAV = [
    { g: 'Companies' },
    { k: 'tenants', t: 'Tenants', h: 'platform-tenants.html', i: 'partner', pill: '2' },
    { g: 'Commercial' },
    { k: 'plans', t: 'Plans', h: 'platform-plans.html', i: 'acc' },
    { g: 'System' },
    { k: 'health', t: 'Health', h: 'platform-health.html', i: 'rep' },
  ];

  const REPORT_NAV = [
    { g: 'Favourites' },
    { k: 'pl', t: 'Profit & loss', h: 'reports.html', star: 1 },
    { k: 'expiry', t: 'Expiry report', h: 'report-expiry.html', star: 1 },
    { k: 'cashier', t: 'Sales by cashier', h: 'report-sales-cashier.html', star: 1 },
    { g: 'Financial' },
    { k: 'tb', t: 'Trial balance', h: 'report-trial-balance.html' },
    { k: 'bs', t: 'Balance sheet', h: 'report-balance-sheet.html' },
    { k: 'gl', t: 'General ledger', h: 'report-ledger.html' },
    { k: 'ar', t: 'AR aging', h: 'report-aging.html' },
    { k: 'ap', t: 'AP aging', h: 'report-aging.html#ap' },
    { k: 'cstmt', t: 'Customer statements', h: 'customer.html' },
    { k: 'sstmt', t: 'Supplier statements', h: 'supplier.html' },
    { k: 'jrn', t: 'Journal entries', h: 'accounting.html#jrn' },
    { g: 'Sales' },
    { k: 'ssum', t: 'Sales summary', h: 'report-sales-summary.html' },
    { k: 'sdet', t: 'Sales detail', h: 'sales.html' },
    { k: 'sprod', t: 'By product', h: 'report-sales-summary.html#product' },
    { k: 'sbatch', t: 'By batch', h: 'report-cogs.html' },
    { k: 'scust', t: 'By customer', h: 'report-sales-summary.html#customer' },
    { k: 'sret', t: 'Returns', h: 'sales.html' },
    { k: 'sdisc', t: 'Discounts', h: 'report-sales-summary.html#disc' },
    { k: 'cogs', t: 'COGS & gross profit', h: 'report-cogs.html' },
    { g: 'Inventory' },
    { k: 'stock', t: 'Current stock', h: 'report-stock.html' },
    { k: 'sled', t: 'Stock ledger', h: 'report-stock.html#ledger' },
    { k: 'batch', t: 'Batch report', h: 'inventory.html' },
    { k: 'val', t: 'Valuation', h: 'report-stock.html#val' },
    { k: 'low', t: 'Low stock', h: 'report-low-stock.html' },
    { k: 'adj', t: 'Adjustments', h: 'inventory.html' },
    { k: 'stv', t: 'Stocktake variance', h: 'stocktake.html' },
    { g: 'Purchases' },
    { k: 'psum', t: 'Purchase summary', h: 'purchases.html' },
    { k: 'psup', t: 'By supplier', h: 'purchases.html' },
    { k: 'pret', t: 'Returns', h: 'purchases.html' },
    { k: 'pay', t: 'Payables', h: 'report-payables.html' },
  ];

  const SETTINGS_NAV = [
    { g: 'Organisation' },
    { k: 'profile', t: 'Business profile', h: 'settings-profile.html' },
    { k: 'branches', t: 'Branches & warehouses', h: 'settings-branches.html' },
    { k: 'sub', t: 'Subscription', h: 'settings-subscription.html' },
    { k: 'users', t: 'Users', h: 'settings-users.html' },
    { k: 'roles', t: 'Roles & permissions', h: 'settings.html' },
    { g: 'Operations' },
    { k: 'pos', t: 'POS & receipts', h: 'settings-pos.html' },
    { k: 'inv', t: 'Inventory thresholds', h: 'settings-inventory.html' },
    { k: 'num', t: 'Document numbering', h: 'settings-numbering.html' },
    { k: 'paym', t: 'Payment methods', h: 'settings-payments.html' },
    { k: 'tax', t: 'Taxes', h: 'settings-taxes.html' },
    { g: 'Finance' },
    { k: 'coa', t: 'Chart of accounts', h: 'accounting.html' },
    { k: 'periods', t: 'Fiscal periods & lock date', h: 'settings-periods.html' },
    { g: 'System' },
    { k: 'notif', t: 'Notifications', h: 'settings-notifications.html' },
    { k: 'imp', t: 'Imports', h: 'settings-imports.html' },
    { k: 'audit', t: 'Audit log', h: 'settings-audit.html' },
    { k: 'int', t: 'Integrations', h: '#', p2: 1 },
  ];

  function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }

  function buildReportNav() {
    const host = document.querySelector('[data-report-nav]');
    if (!host) return;
    let cur = host.dataset.reportNav;
    const h = location.hash.replace('#', '');
    if (h === 'ap') cur = 'ap';
    if (h === 'val' || h === 'ledger') cur = h === 'ledger' ? 'sled' : 'val';
    if (h === 'product' || h === 'customer' || h === 'disc') cur = h === 'disc' ? 'sdisc' : (h === 'customer' ? 'scust' : 'sprod');
    host.innerHTML = `<div class="input-wrap" style="margin:4px"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg><input class="input sm" placeholder="Find report…"></div>` +
      REPORT_NAV.map(n => n.g
        ? `<div class="group">${n.g}</div>`
        : `<a href="${n.h}" class="${n.k === cur ? 'on' : ''}">${n.t}${n.star ? ' <span class="star">★</span>' : ''}</a>`
      ).join('');
    const q = host.querySelector('input');
    if (q) q.addEventListener('input', () => {
      const v = q.value.toLowerCase();
      host.querySelectorAll('a').forEach(a => { a.style.display = !v || a.textContent.toLowerCase().includes(v) ? '' : 'none'; });
    });
  }

  function buildSettingsNav() {
    const host = document.querySelector('[data-settings-nav]');
    if (!host) return;
    const cur = host.dataset.settingsNav;
    host.innerHTML = SETTINGS_NAV.map(n => n.g
      ? `<div class="group">${n.g}</div>`
      : `<a href="${n.h}" class="${n.k === cur ? 'on' : ''}">${n.t}${n.p2 ? ' <span class="badge">P2</span>' : ''}</a>`
    ).join('');
  }

  function buildShell() {
    const page = document.body.dataset.page || '';
    const isPlat = document.body.dataset.shell === 'platform';
    const crumbs = (document.body.dataset.crumbs || (isPlat ? 'Tenants' : 'Dashboard')).split('/').map(s => s.trim());
    const app = document.querySelector('.app');
    if (!app) return;

    const items = isPlat ? PLATFORM_NAV : NAV;
    const nav = items.map(n => n.g
      ? `<div class="group">${n.g}</div>`
      : `<a href="${n.h}" class="${n.k === page ? 'active' : ''}"><i>${I[n.i]}</i><span>${n.t}</span>${n.pill ? `<b class="pill">${n.pill}</b>` : ''}${n.kbd ? `<kbd style="margin-left:auto">${n.kbd}</kbd>` : ''}</a>`
    ).join('');

    const sidebar = el(isPlat
      ? `<aside class="sidebar">
      <div class="brand"><div class="mark"></div><div class="name">PharmaPro<small>Platform</small></div></div>
      <nav class="nav">${nav}</nav>
      <div class="sidebar-foot"><div class="avatar">PP</div><div class="meta"><b>Platform admin</b><span>ops@pharmapro.pk</span></div></div>
    </aside>`
      : `<aside class="sidebar">
      <div class="brand"><div class="mark"></div><div class="name">PharmaPro<small>Demo Pharmacy</small></div></div>
      <nav class="nav">${nav}</nav>
      <div class="sidebar-foot"><div class="avatar">AQ</div><div class="meta"><b>Aquib Khan</b><span>Owner · Main Branch</span></div></div>
    </aside>`);

    const crumbHtml = crumbs.map((c, i) => i === crumbs.length - 1 ? `<b>${c}</b>` : `<span>${c}</span><span class="sep">/</span>`).join('');
    const topbar = el(isPlat
      ? `<header class="topbar">
      <button class="iconbtn" data-action="toggle-sidebar" title="Collapse sidebar">${I.menu}</button>
      <div class="crumbs">${crumbHtml}</div>
      <div class="search" data-open="palette">${I.search}<span>Find a tenant, owner email, NTN…</span><kbd>Ctrl K</kbd></div>
      <div class="chip-select" title="Environment"><span class="lbl">Env</span><b>Staging</b></div>
      <button class="iconbtn" title="Notifications" data-open="notif">${I.bell}<span class="dot"></span></button>
      <button class="iconbtn" title="Shortcuts (?)" data-open="shortcuts">${I.help}</button>
    </header>`
      : `<header class="topbar">
      <button class="iconbtn" data-action="toggle-sidebar" title="Collapse sidebar">${I.menu}</button>
      <div class="crumbs">${crumbHtml}</div>
      <div class="search" data-open="palette">${I.search}<span>Search or jump to…</span><kbd>Ctrl K</kbd></div>
      <div class="chip-select" title="Active branch">${I.branch}<span class="lbl">Branch</span><b>Main</b></div>
      <div class="chip-select" title="Business date"><span class="lbl">Date</span><b>08 Oct 2026</b></div>
      <button class="iconbtn" title="Notifications" data-open="notif">${I.bell}<span class="dot"></span></button>
      <button class="iconbtn" title="Shortcuts (?)" data-open="shortcuts">${I.help}</button>
    </header>`);

    app.prepend(topbar);
    app.prepend(sidebar);

    document.body.append(el(`<div class="toast-wrap" id="toasts"></div>`));
    if (isPlat) {
      document.body.append(el(`<div class="overlay" id="palette"><div class="modal palette">
      <input class="input" placeholder="Tenant name, owner email, NTN…" autofocus>
      <ul>
        <li class="on" data-href="platform-tenants.html"><span class="grp">Go to</span>All tenants</li>
        <li data-href="platform-tenant-new.html"><span class="grp">Action</span>Create tenant</li>
        <li data-href="platform-tenant.html"><span class="grp">Tenant</span>Demo Pharmacy — due in 12 days</li>
        <li data-href="platform-tenant.html"><span class="grp">Tenant</span>Al-Shifa — grace 4 days</li>
        <li data-href="platform-plans.html"><span class="grp">Go to</span>Plans &amp; caps</li>
        <li data-href="platform-health.html"><span class="grp">Go to</span>Platform health</li>
      </ul></div></div>`));
      document.body.append(el(`<div class="overlay" id="shortcuts"><div class="modal narrow">
      <div class="modal-head"><h2>Keyboard shortcuts</h2><button class="iconbtn" data-close>${I.x}</button></div>
      <div class="modal-body"><div class="shortcut-list">
        <div>Command palette<kbd>Ctrl K</kbd></div><div>New tenant<kbd>Alt N</kbd></div>
        <div>This help<kbd>?</kbd></div><div>Close<kbd>Esc</kbd></div>
      </div></div></div></div>`));
      document.body.append(el(`<div class="drawer" id="notif">
      <div class="modal-head"><h2>Platform alerts</h2><span class="badge danger">3</span><button class="iconbtn" data-close>${I.x}</button></div>
      <div class="modal-body">
        <ul class="timeline">
          <li class="warn"><div><b>Demo Pharmacy</b> — Professional ends 20 Oct (12 days)<div class="t">Owner banner is live</div></div></li>
          <li class="danger"><div><b>Al-Shifa Medical</b> — grace day 4 of 7 · posting freeze 15 Oct<div class="t">No payment recorded</div></div></li>
          <li class="ok"><div><b>Backup</b> — nightly dump finished · 1.8 GB<div class="t">Today 03:12</div></div></li>
          <li><div><b>Old Mart</b> — read-only since 01 Sep<div class="t">Awaiting export request</div></div></li>
        </ul>
      </div>
      <div class="modal-foot"><button class="btn sm ghost">Mark all read</button><div class="right"><a href="platform-tenants.html" class="btn sm">Open tenants</a></div></div>
    </div>`));
    } else {
      document.body.append(el(`<div class="overlay" id="palette"><div class="modal palette">
      <input class="input" placeholder="Type a command, product, customer or invoice number…" autofocus>
      <ul>
        <li class="on" data-href="pos.html"><span class="grp">Go to</span>Point of Sale<kbd>F2</kbd></li>
        <li data-href="inventory.html"><span class="grp">Go to</span>Inventory › Expiry in 30 days</li>
        <li data-href="purchase-entry.html"><span class="grp">Action</span>New purchase invoice<kbd>Alt N</kbd></li>
        <li data-href="customer-new.html"><span class="grp">Action</span>New customer</li>
        <li data-href="supplier-new.html"><span class="grp">Action</span>New supplier</li>
        <li data-href="approvals.html"><span class="grp">Go to</span>Approvals — 2 pending</li>
        <li data-href="manufacturers.html"><span class="grp">Action</span>New manufacturer</li>
        <li data-href="accounting.html"><span class="grp">Action</span>Chart of accounts / new account</li>
        <li data-href="sales-return.html"><span class="grp">Action</span>New sales return</li>
        <li data-href="purchase-return.html"><span class="grp">Action</span>New purchase return</li>
        <li data-href="settings-subscription.html"><span class="grp">Settings</span>Subscription — due 20 Oct</li>
        <li data-href="settings-branches.html"><span class="grp">Settings</span>Branches &amp; warehouses</li>
        <li data-href="settings-users.html"><span class="grp">Settings</span>Users &amp; invitations</li>
        <li data-href="settings-imports.html"><span class="grp">Settings</span>Opening stock import</li>
        <li data-href="settings-audit.html"><span class="grp">Settings</span>Audit log</li>
        <li data-href="customer.html"><span class="grp">Customer</span>Ahmed Raza — balance PKR 19,200</li>
      </ul></div></div>`));
      document.body.append(el(`<div class="overlay" id="shortcuts"><div class="modal narrow">
      <div class="modal-head"><h2>Keyboard shortcuts</h2><button class="iconbtn" data-close>${I.x}</button></div>
      <div class="modal-body"><div class="shortcut-list">
        <div>Command palette<kbd>Ctrl K</kbd></div><div>Open POS<kbd>F2</kbd></div>
        <div>Focus barcode<kbd>Esc</kbd></div><div>Search product<kbd>/</kbd></div>
        <div>Customer<kbd>F4</kbd></div><div>Hold cart<kbd>F6</kbd></div>
        <div>Resume cart<kbd>F7</kbd></div><div>Return<kbd>F8</kbd></div>
        <div>Payment<kbd>F9</kbd></div><div>Post &amp; print<kbd>Ctrl ↵</kbd></div>
        <div>New row (grids)<kbd>↵ on last cell</kbd></div><div>This help<kbd>?</kbd></div>
      </div></div></div></div>`));
      document.body.append(el(`<div class="drawer" id="notif">
      <div class="modal-head"><h2>Notifications</h2><span class="badge danger">3 new</span><button class="iconbtn" data-close>${I.x}</button></div>
      <div class="modal-body">
        <ul class="timeline">
          <li class="warn"><div><b>Subscription</b> — Professional plan ends 20 Oct 2026 (12 days)<div class="t">Today 06:00 · Billing</div></div></li>
          <li class="danger"><div><b>Expiring in 30 days</b> — 7 batches worth PKR 48,200<div class="t">Today 06:00 · Expiry digest</div></div></li>
          <li class="warn"><div><b>Adjustment awaiting approval</b> — ADJ26-000031 (PKR 12,600, reason: Damage) by Sana<div class="t">Today 11:42</div></div></li>
          <li class="ok"><div><b>Payment received</b> — PKR 5,000 from Ahmed Raza allocated to INV26-000388<div class="t">Yesterday 17:20</div></div></li>
        </ul>
      </div>
      <div class="modal-foot"><button class="btn sm ghost">Mark all read</button><div class="right"><a href="settings-subscription.html" class="btn sm">Subscription</a></div></div>
    </div>`));
    }
    document.body.append(el(`<div class="wire-note"><b>Wireframe</b> · static HTML mockup · interactions are simulated</div>`));
  }

  function toast(msg, kind) {
    const t = el(`<div class="toast ${kind || ''}">${msg}</div>`);
    document.getElementById('toasts').append(t);
    setTimeout(() => t.remove(), 2800);
  }
  window.toast = toast;

  function wire() {
    document.addEventListener('click', e => {
      const open = e.target.closest('[data-open]');
      if (open) { const t = document.getElementById(open.dataset.open); if (t) { t.classList.add('open'); const inp = t.querySelector('input'); if (inp) setTimeout(() => inp.focus(), 30); } return; }
      const close = e.target.closest('[data-close]');
      if (close) {
        if (close.dataset.action === 'toast') toast(close.dataset.msg || 'Done', close.dataset.kind || 'ok');
        close.closest('.overlay, .drawer').classList.remove('open');
        return;
      }
      if (e.target.classList.contains('overlay')) { e.target.classList.remove('open'); return; }
      const tab = e.target.closest('.tabs button');
      if (tab) {
        const tabs = tab.parentElement; const group = tabs.dataset.tabs;
        tabs.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === tab));
        if (group) document.querySelectorAll(`.tab-panel[data-tab-group="${group}"]`).forEach(p => p.classList.toggle('on', p.dataset.tab === tab.dataset.tab));
        return;
      }
      const seg = e.target.closest('.seg button');
      if (seg) { seg.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === seg)); return; }
      const grp = e.target.closest('.btn-group .btn[data-toggle]');
      if (grp) { grp.parentElement.querySelectorAll('.btn').forEach(b => b.classList.toggle('on', b === grp)); return; }
      const sw = e.target.closest('.switch');
      if (sw) { sw.classList.toggle('on'); return; }
      const chip = e.target.closest('.filter-chip');
      if (chip && !e.target.closest('.x')) { chip.classList.toggle('on'); return; }
      const th = e.target.closest('th.sort');
      if (th) { const was = th.classList.contains('asc'); th.closest('tr').querySelectorAll('th').forEach(h => h.classList.remove('asc', 'desc')); th.classList.add(was ? 'desc' : 'asc'); return; }
      const act = e.target.closest('[data-action]');
      if (act) {
        const a = act.dataset.action;
        if (a === 'toggle-sidebar') document.body.classList.toggle('sidebar-collapsed');
        else if (a === 'toast') toast(act.dataset.msg || 'Done', act.dataset.kind || 'ok');
        return;
      }
      const pal = e.target.closest('#palette li[data-href]');
      if (pal) { location.href = pal.dataset.href; return; }
      const row = e.target.closest('tr[data-select]');
      if (row) { row.parentElement.querySelectorAll('tr').forEach(r => r.classList.toggle('selected', r === row)); const tgt = row.dataset.select; if (tgt) { const d = document.getElementById(tgt); if (d) d.classList.add('open'); } }
    });

    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); document.getElementById('palette').classList.add('open'); document.querySelector('#palette input').focus(); }
      if (e.key === 'Escape') document.querySelectorAll('.overlay.open, .drawer.open').forEach(o => o.classList.remove('open'));
      if (e.key === '?' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) document.getElementById('shortcuts').classList.add('open');
      if (e.key === 'F2' && document.body.dataset.shell !== 'platform') { e.preventDefault(); location.href = 'pos.html'; }
      if (e.altKey && e.key.toLowerCase() === 'n') {
        const page = document.body.dataset.page;
        if (document.body.dataset.shell === 'platform') { e.preventDefault(); location.href = 'platform-tenant-new.html'; }
        else if (page === 'customers') { e.preventDefault(); location.href = 'customer-new.html'; }
        else if (page === 'suppliers') { e.preventDefault(); location.href = 'supplier-new.html'; }
        else if (page === 'manufacturers') { e.preventDefault(); const m = document.getElementById('newm'); if (m) m.classList.add('open'); }
        else if (page === 'accounting') { e.preventDefault(); const m = document.getElementById('newacc'); if (m) m.classList.add('open'); }
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    buildShell();
    buildReportNav();
    buildSettingsNav();
    wire();
    const hash = location.hash.replace('#', '');
    if (hash) {
      const btn = document.querySelector(`.tabs button[data-tab="${hash}"]`);
      if (btn) {
        const tabs = btn.parentElement; const group = tabs.dataset.tabs;
        tabs.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === btn));
        if (group) document.querySelectorAll(`.tab-panel[data-tab-group="${group}"]`).forEach(p => p.classList.toggle('on', p.dataset.tab === btn.dataset.tab));
      }
    }
  });
})();
