let shopConfig = null;

const state = {
  search: "",
  category: "All",
  sort: "recommended"
};

const elements = {
  searchInput: document.getElementById("searchInput"),
  categorySelect: document.getElementById("categorySelect"),
  sortSelect: document.getElementById("sortSelect"),
  productGrid: document.getElementById("productGrid"),
  resultCount: document.getElementById("resultCount")
};

async function loadConfig() {
  const response = await fetch("config.json");

  if (!response.ok) {
    throw new Error("config.json konnte nicht geladen werden.");
  }

  return response.json();
}

function formatPrice(price) {
  return `${Number(price).toFixed(2).replace(".", ",")} ${shopConfig.currency}`;
}

function getProductStartPrice(product) {
  if (typeof product.priceFrom === "number") {
    return product.priceFrom;
  }

  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return Math.min(...product.variants.map((variant) => Number(variant.price)));
  }

  return Number(product.price || 0);
}

function getFilteredProducts() {
  let products = shopConfig.products.filter((product) => {
    const search = state.search.toLowerCase().trim();

    const matchesSearch =
      product.name.toLowerCase().includes(search) ||
      product.description.toLowerCase().includes(search) ||
      product.category.toLowerCase().includes(search);

    const matchesCategory =
      state.category === "All" || product.category === state.category;

    return matchesSearch && matchesCategory;
  });

  if (state.sort === "price-low") {
    products = [...products].sort((a, b) => getProductStartPrice(a) - getProductStartPrice(b));
  }

  if (state.sort === "price-high") {
    products = [...products].sort((a, b) => getProductStartPrice(b) - getProductStartPrice(a));
  }

  if (state.sort === "rating") {
    products = [...products].sort((a, b) => b.rating - a.rating);
  }

  return products;
}

function renderCategories() {
  const categories = [
    "All",
    ...new Set(shopConfig.products.map((product) => product.category))
  ];

  elements.categorySelect.innerHTML = categories
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join("");
}

function renderProducts() {
  const products = getFilteredProducts();

  elements.resultCount.textContent =
    `${products.length} ${products.length === 1 ? "Product" : "Products"} found`;

  if (products.length === 0) {
    elements.productGrid.innerHTML = `<div class="empty">No products found.</div>`;
    return;
  }

  elements.productGrid.innerHTML = products
    .map((product) => {
      const accent = product.accent || "#ff38f5";
      const symbol = product.symbol || product.name.slice(0, 2).toUpperCase();
      const variantCount = Array.isArray(product.variants) ? product.variants.length : 0;

      return `
        <article class="product-card" style="--card-accent: ${escapeAttribute(accent)}">
          <a class="product-card-link" href="product.html?id=${encodeURIComponent(product.id)}">
            <div class="product-visual">
              <span class="badge">${escapeHtml(product.badge)}</span>
              <div class="product-symbol">${escapeHtml(symbol)}</div>
            </div>

            <div class="product-body">
              <div class="product-meta">
                <span>${escapeHtml(product.category)}</span>
                <span class="rating">★ ${Number(product.rating).toFixed(1)}</span>
              </div>

              <h3>${escapeHtml(product.name)}</h3>
              <p class="description">${escapeHtml(product.description)}</p>

              <div class="product-footer">
                <span class="price">ab ${formatPrice(getProductStartPrice(product))}</span>
                <span class="neon-button">${variantCount} Variants</span>
              </div>
            </div>
          </a>
        </article>
      `;
    })
    .join("");
}

function bindEvents() {
  elements.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderProducts();
  });

  elements.categorySelect.addEventListener("change", (event) => {
    state.category = event.target.value;
    renderProducts();
  });

  elements.sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderProducts();
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function showConfigError(error) {
  elements.productGrid.innerHTML = `
    <div class="error-box">
      <strong>error loading config file</strong>
      ${escapeHtml(error.message)}
    </div>
  `;
}

async function init() {
  try {
    shopConfig = await loadConfig();
    renderCategories();
    renderProducts();
    bindEvents();
  } catch (error) {
    showConfigError(error);
  }
}

init();
