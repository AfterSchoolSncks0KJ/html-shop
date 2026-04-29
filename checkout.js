let shopConfig = null;

const elements = {
  checkoutPanel: document.getElementById("checkoutPanel")
};

async function loadConfig() {
  const response = await fetch("config.json");

  if (!response.ok) {
    throw new Error("error loading config file");
  }

  return response.json();
}

function getParams() {
  const params = new URLSearchParams(window.location.search);

  return {
    productId: params.get("product"),
    variantId: params.get("variant")
  };
}

function formatPrice(price) {
  return `${Number(price).toFixed(2).replace(".", ",")} ${shopConfig.currency}`;
}

function renderCheckout(product, variant) {
  document.title = `${variant.name} Checkout | ${shopConfig.shopName}`;

  elements.checkoutPanel.innerHTML = `
    <div class="panel-noise"></div>

    <div class="checkout-content">
      <div class="checkout-icon">OK</div>
      <span class="kicker">VARIANT PAGE</span>
      <h1>${escapeHtml(variant.name)}</h1>
      <p>
        NOTE TOM THE CAT
        <strong>${escapeHtml(product.name)}</strong>.
        NOTE TOM THE CAT
      </p>

      <div class="checkout-summary">
        <div class="checkout-row">
          <span>product</span>
          <strong>${escapeHtml(product.name)}</strong>
        </div>
        <div class="checkout-row">
          <span>variant</span>
          <strong>${escapeHtml(variant.name)}</strong>
        </div>
        <div class="checkout-row">
          <span>price</span>
          <strong>${formatPrice(variant.price)}</strong>
        </div>
        <div class="checkout-row">
          <span>Variant ID</span>
          <strong>${escapeHtml(variant.id)}</strong>
        </div>
      </div>

      <div class="checkout-actions">
        <a class="neon-button neon-button-primary" href="product.html?id=${encodeURIComponent(product.id)}">
          Back
        </a>
        <a class="neon-button" href="index.html">
          SHOP
        </a>
      </div>
    </div>
  `;
}

function showError(message) {
  elements.checkoutPanel.innerHTML = `
    <div class="error-box">
      <strong>${escapeHtml(message)}</strong><br />
      <a class="neon-button" href="index.html">Back to the Shop</a>
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

async function init() {
  try {
    shopConfig = await loadConfig();

    const { productId, variantId } = getParams();

    if (!productId || !variantId) {
      showError("Product or variant missing in URL.");
      return;
    }

    const product = shopConfig.products.find((item) => item.id === productId);

    if (!product) {
      showError("Product not found.");
      return;
    }

    const variant = product.variants.find((item) => item.id === variantId);

    if (!variant) {
      showError("Variant not found.");
      return;
    }

    renderCheckout(product, variant);
  } catch (error) {
    showError(`Error loading: ${error.message}`);
  }
}

init();
