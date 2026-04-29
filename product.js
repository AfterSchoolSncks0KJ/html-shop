let shopConfig = null;
let selectedVariant = null;

const elements = {
  detail: document.getElementById("productDetail")
};

async function loadConfig() {
  const response = await fetch("config.json");

  if (!response.ok) {
    throw new Error("config.json konnte nicht geladen werden.");
  }

  return response.json();
}

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function formatPrice(price) {
  return `${Number(price).toFixed(2).replace(".", ",")} ${shopConfig.currency}`;
}

function renderProduct(product) {
  const accent = product.accent || "#ff38f5";
  const symbol = product.symbol || product.name.slice(0, 2).toUpperCase();
  const variants = Array.isArray(product.variants) ? product.variants : [];

  selectedVariant = variants[0] || null;
  document.title = `${product.name} | ${shopConfig.shopName}`;

  elements.detail.style.setProperty("--card-accent", accent);

  elements.detail.innerHTML = `
    <div class="panel-noise"></div>

    <div class="detail-content">
      <div class="detail-visual">
        <div class="detail-symbol">${escapeHtml(symbol)}</div>
      </div>

      <div class="detail-copy">
        <span class="kicker">${escapeHtml(product.category)}</span>
        <h1>${escapeHtml(product.name)}</h1>
        <p>${escapeHtml(product.description)}</p>

        <div class="detail-meta">
          <span class="meta-pill">★ ${Number(product.rating).toFixed(1)} Rating</span>
          <span class="meta-pill">${variants.length} Varianten</span>
          <span class="meta-pill">${escapeHtml(product.badge)}</span>
        </div>

        <h2 class="variants-title">VARIANTE WÄHLEN</h2>
        <div class="variant-grid" id="variantGrid">
          ${variants.map((variant, index) => renderVariantCard(variant, index === 0)).join("")}
        </div>

        <div class="buy-bar">
          <div class="selected-info">
            <span>Ausgewählt</span>
            <strong id="selectedVariantLabel">${selectedVariant ? escapeHtml(selectedVariant.name) : "Keine Variante"}</strong>
          </div>

          <button class="neon-button neon-button-primary" id="buyButton" type="button" ${selectedVariant ? "" : "disabled"}>
            KAUFEN
          </button>
        </div>
      </div>
    </div>
  `;

  bindVariantEvents(product);
}

function renderVariantCard(variant, isActive) {
  return `
    <button
      class="variant-card ${isActive ? "active" : ""}"
      type="button"
      data-variant-id="${escapeAttribute(variant.id)}"
    >
      <strong>${escapeHtml(variant.name)}</strong>
      <span>${escapeHtml(variant.description || "Variante auswählen")}</span>
      <span class="variant-price">${formatPrice(variant.price)}</span>
    </button>
  `;
}

function bindVariantEvents(product) {
  const variantGrid = document.getElementById("variantGrid");
  const selectedVariantLabel = document.getElementById("selectedVariantLabel");
  const buyButton = document.getElementById("buyButton");

  variantGrid.addEventListener("click", (event) => {
    const card = event.target.closest(".variant-card");

    if (!card) {
      return;
    }

    const variantId = card.dataset.variantId;
    const variant = product.variants.find((item) => item.id === variantId);

    if (!variant) {
      return;
    }

    selectedVariant = variant;

    document.querySelectorAll(".variant-card").forEach((item) => {
      item.classList.toggle("active", item.dataset.variantId === variantId);
    });

    selectedVariantLabel.textContent = selectedVariant.name;
    buyButton.disabled = false;
  });

  buyButton.addEventListener("click", () => {
    if (!selectedVariant) {
      alert("Bitte wähle zuerst eine Variante aus.");
      return;
    }

    if (!selectedVariant.redirectUrl) {
      alert("Für diese Variante ist noch keine redirectUrl in der config.json gesetzt.");
      return;
    }

    window.location.href = selectedVariant.redirectUrl;
  });
}

function showError(message) {
  elements.detail.innerHTML = `
    <div class="error-box">
      <strong>${escapeHtml(message)}</strong><br />
      <a class="neon-button" href="index.html">Zurück zum Shop</a>
    </div>
  `;
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

async function init() {
  try {
    shopConfig = await loadConfig();

    const productId = getProductIdFromUrl();

    if (!productId) {
      showError("Keine Produkt-ID in der URL gefunden.");
      return;
    }

    const product = shopConfig.products.find((item) => item.id === productId);

    if (!product) {
      showError("Produkt wurde nicht gefunden.");
      return;
    }

    renderProduct(product);
  } catch (error) {
    showError(`Fehler beim Laden: ${error.message}`);
  }
}

init();
