

/* ==========================================
   SOLECRAFT SHOPPING CART SYSTEM
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {

  const CART_KEY = "solecraft_cart";

  // ENTER YOUR BUSINESS WHATSAPP NUMBER HERE
  // International format without + or spaces
  const WHATSAPP_NUMBER = "";

  const formatMoney = amount =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0
    }).format(amount);

  function getCart() {
    try {
      const stored = JSON.parse(
        localStorage.getItem(CART_KEY) || "[]"
      );
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  }

  let cart = getCart();

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
  }

  function updateCartCount() {
    const count = cart.reduce(
      (sum, item) => sum + item.quantity, 0
    );

    document.querySelectorAll(".cart-count").forEach(el => {
      el.textContent = count;
    });
  }

  // ========================================
  // ADD TO CART FROM SHOP PAGE
  // ========================================

  const shopCards = document.querySelectorAll(".shoe-card");

  shopCards.forEach(card => {
    const orderButton = card.querySelector(".shoe-order");
    const details = card.querySelector(".shoe-details");

    if (!orderButton || !details) return;

    // Automatically insert a size selector
    const sizeLabel = document.createElement("label");
    sizeLabel.className = "shoe-size-label";
    sizeLabel.textContent = "Select Shoe Size";

    const sizeSelect = document.createElement("select");
    sizeSelect.className = "shoe-size-select";
    sizeSelect.setAttribute("aria-label", "Select shoe size");

    const sizes = ["", "38", "39", "40", "41", "42",
                   "43", "44", "45", "46"];

    sizes.forEach(size => {
      const option = document.createElement("option");
      option.value = size;
      option.textContent = size ? `EU ${size}` : "Choose size";
      sizeSelect.appendChild(option);
    });

    details.insertBefore(sizeLabel, orderButton);
    details.insertBefore(sizeSelect, orderButton);

    orderButton.textContent = "Add to Cart";

    orderButton.addEventListener("click", () => {
      const name = card.querySelector("h3").textContent.trim();
      const priceText =
        card.querySelector(".shoe-price").textContent;

      const price = Number(
        priceText.replace(/[^\d.]/g, "")
      );

      const image = card.querySelector("img").getAttribute("src");
      const size = sizeSelect.value;

      if (!size) {
        alert("Please select your shoe size.");
        sizeSelect.focus();
        return;
      }

      if (!Number.isFinite(price) || price <= 0) {
        alert("This product has an invalid price.");
        return;
      }

      const existing = cart.find(item =>
        item.name === name && item.size === size
      );

      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({
          id: `${name}-${size}`,
          name,
          price,
          image,
          size,
          quantity: 1
        });
      }

      saveCart();

      const originalText = "Add to Cart";
      orderButton.textContent = "Added to Cart ✓";

      setTimeout(() => {
        orderButton.textContent = originalText;
      }, 1200);
    });
  });

  // ========================================
  // CART PAGE
  // ========================================

  const cartItems = document.getElementById("cartItems");
  const emptyCart = document.getElementById("emptyCart");
  const checkoutForm = document.getElementById("checkoutForm");

  function renderCart() {
    if (!cartItems) return;

    cartItems.replaceChildren();

    const totalQuantity = cart.reduce(
      (sum, item) => sum + item.quantity, 0
    );

    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity, 0
    );

    const itemCount = document.getElementById("cartItemCount");
    const subtotalEl = document.getElementById("cartSubtotal");
    const totalEl = document.getElementById("cartTotal");
    const checkoutButton = document.getElementById("checkoutButton");
    const continueLink = document.getElementById("continueShopping");

    if (itemCount) {
      itemCount.textContent =
        `${totalQuantity} item${totalQuantity === 1 ? "" : "s"}`;
    }

    if (subtotalEl) subtotalEl.textContent = formatMoney(subtotal);
    if (totalEl) totalEl.textContent = formatMoney(subtotal);

    if (emptyCart) emptyCart.hidden = cart.length > 0;
    if (continueLink) continueLink.hidden = cart.length === 0;
    if (checkoutButton) checkoutButton.disabled = cart.length === 0;

    cart.forEach((item, index) => {
      const row = document.createElement("article");
      row.className = "cart-item";

      // Static structure only; product data inserted as text
      row.innerHTML = `
        <div class="cart-item-image">
          <img alt="" loading="lazy">
        </div>
        <div class="cart-item-info">
          <h3></h3>
          <p class="item-size"></p>
          <p class="item-unit-price"></p>
          <div class="cart-item-price"></div>
          <div class="cart-item-bottom">
            <div class="quantity-control">
              <button type="button" data-action="decrease"
                      aria-label="Decrease quantity">−</button>
              <span></span>
              <button type="button" data-action="increase"
                      aria-label="Increase quantity">+</button>
            </div>
            <button type="button" class="remove-cart-item"
                    data-action="remove">Remove</button>
          </div>
        </div>
      `;

      row.querySelector("img").src = item.image;
      row.querySelector("img").alt = item.name;
      row.querySelector("h3").textContent = item.name;
      row.querySelector(".item-size").textContent =
        `Size: EU ${item.size}`;
      row.querySelector(".item-unit-price").textContent =
        `Unit price: ${formatMoney(item.price)}`;
      row.querySelector(".cart-item-price").textContent =
        formatMoney(item.price * item.quantity);
      row.querySelector(".quantity-control span").textContent =
        item.quantity;

      row.querySelectorAll("[data-action]").forEach(button => {
        button.addEventListener("click", () => {
          const action = button.dataset.action;

          if (action === "increase") {
            cart[index].quantity += 1;
          }

          if (action === "decrease") {
            cart[index].quantity -= 1;
            if (cart[index].quantity <= 0) {
              cart.splice(index, 1);
            }
          }

          if (action === "remove") {
            cart.splice(index, 1);
          }

          saveCart();
          renderCart();
        });
      });

      cartItems.appendChild(row);
    });
  }

  // ========================================
  // WHATSAPP CHECKOUT
  // ========================================

  if (checkoutForm) {
    checkoutForm.addEventListener("submit", event => {
      event.preventDefault();

      const messageElement =
        document.getElementById("checkoutMessage");

      messageElement.textContent = "";

      if (cart.length === 0) {
        messageElement.textContent = "Your cart is empty.";
        return;
      }

      if (!checkoutForm.reportValidity()) return;

      if (!/^\d{7,15}$/.test(WHATSAPP_NUMBER)) {
        messageElement.textContent =
          "The business WhatsApp number has not been configured.";
        return;
      }

      const name = document.getElementById("customerName").value.trim();
      const phone = document.getElementById("customerPhone").value.trim();
      const address = document.getElementById("customerAddress").value.trim();
      const notes = document.getElementById("orderNotes").value.trim();

      const orderLines = cart.map((item, index) => {
        return [
          `${index + 1}. ${item.name}`,
          `Size: EU ${item.size}`,
          `Quantity: ${item.quantity}`,
          `Price: ${formatMoney(item.price * item.quantity)}`
        ].join("\n");
      });

      const subtotal = cart.reduce(
        (sum, item) => sum + item.price * item.quantity, 0
      );

      const message = [
        "HELLO SOLECRAFT!",
        "I would like to place an order.",
        "",
        "*CUSTOMER DETAILS*",
        `Name: ${name}`,
        `Phone: ${phone}`,
        `Address: ${address}`,
        "",
        "*ORDER DETAILS*",
        ...orderLines,
        "",
        `*Products Total: ${formatMoney(subtotal)}*`,
        "Delivery: To be confirmed",
        "",
        `Additional Notes: ${notes || "None"}`,
        "",
        "Please confirm availability, delivery cost and payment details."
      ].join("\n");

      const url = `https://wa.me/${2348147832045}?text=${
        encodeURIComponent(message)
      }`;

      // The customer must press Send in WhatsApp.
      window.open(url, "_blank", "noopener,noreferrer");

      messageElement.style.color = "#28734a";
      messageElement.textContent =
        "WhatsApp has been opened. Please send your order message there.";
    });
  }

  updateCartCount();
  renderCart();

});


/* ==========================================
   SOLECRAFT - MAIN JAVASCRIPT
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {

  // ========================================
  // 01. MOBILE NAVIGATION
  // ========================================

  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("open");

      menuToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );
    });

    mainNav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }


  // ========================================
  // 02. HOMEPAGE PRODUCT FILTERING
  // ========================================

  const filterButtons = document.querySelectorAll(".filter-btn");
  const homeProducts = document.querySelectorAll(".product-card");

  if (filterButtons.length && homeProducts.length) {
    filterButtons.forEach(button => {
      button.addEventListener("click", () => {

        filterButtons.forEach(btn => {
          btn.classList.remove("active");
        });

        button.classList.add("active");

        const category = button.dataset.filter;

        homeProducts.forEach(product => {
          product.hidden =
            category !== "all" &&
            product.dataset.category !== category;
        });

      });
    });
  }


  // ========================================
  // 03. SHOP PAGE FUNCTIONALITY
  // ========================================

  if (document.getElementById("shopGrid")) {
    initializeShop();
  }


  // ========================================
  // 04. FOOTER COPYRIGHT YEAR
  // ========================================

  const yearElement = document.getElementById("year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

});


// ==========================================
// 05. SHOP INITIALIZATION
// ==========================================

function initializeShop() {

  // The complete shop functionality from
  // the previous shop.js file goes here.
  //
  // Move the products array, product filtering,
  // search, sorting, modal and WhatsApp
  // ordering code into this function.
  //
  // IMPORTANT:
  // Remove the old DOMContentLoaded wrapper
  // when moving the shop.js code.

}


// ==========================================
// 06. SHOPPING CART (NEXT PHASE)
// ==========================================

function initializeCart() {
  // We will implement this next.
}


// ==========================================
// 07. CHECKOUT (FUTURE PHASE)
// ==========================================

function initializeCheckout() {
  // We will implement this later.
}



// ==========================================
// SOLECRAFT SHOP FILTERING
// ==========================================

const shopButtons = document.querySelectorAll(".shop-filter-btn");
const shoeCards = document.querySelectorAll(".shoe-card");
const shoeSearch = document.getElementById("shoeSearch");
const shoeCount = document.getElementById("shoeCount");
const shopEmpty = document.getElementById("shopEmpty");

let selectedCategory = "all";

function filterShoes() {
  if (!shoeCards.length) return;

  const search = shoeSearch
    ? shoeSearch.value.trim().toLowerCase()
    : "";

  let visibleCount = 0;

  shoeCards.forEach(card => {
    const category = card.dataset.category;
    const shoeName = card.querySelector("h3").textContent.toLowerCase();

    const categoryMatch =
      selectedCategory === "all" ||
      category === selectedCategory;

    const searchMatch = shoeName.includes(search);

    const visible = categoryMatch && searchMatch;
    card.hidden = !visible;

    if (visible) visibleCount++;
  });

  if (shoeCount) {
    shoeCount.textContent =
      `${visibleCount} shoe${visibleCount === 1 ? "" : "s"} found`;
  }

  if (shopEmpty) {
    shopEmpty.hidden = visibleCount !== 0;
  }
}

shopButtons.forEach(button => {
  button.addEventListener("click", () => {
    selectedCategory = button.dataset.filter;

    shopButtons.forEach(btn => {
      btn.classList.toggle("active", btn === button);
    });

    filterShoes();
  });
});

if (shoeSearch) {
  shoeSearch.addEventListener("input", filterShoes);
}

filterShoes();



/* ==========================================
   SOLECRAFT CUSTOM ORDER FUNCTIONALITY
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("solecraftCustomForm");

  // Only execute on the Custom Orders page
  if (!form) return;

  // REPLACE WITH YOUR REAL BUSINESS WHATSAPP NUMBER
  const CUSTOM_WHATSAPP_NUMBER = "";

  const imageInput = document.getElementById("customImage");
  const previewBox = document.getElementById("customImagePreview");
  const previewImg = document.getElementById("customPreviewImg");
  const removeImage = document.getElementById("removeCustomImage");
  const formMessage = document.getElementById("customFormMessage");
  const dateInput = document.getElementById("customDate");

  let previewURL = null;

  function setMessage(message, isError = false) {
    formMessage.textContent = message;
    formMessage.style.color = isError ? "#b42318" : "#28734a";
  }

  // Prevent selecting a past delivery date
  const today = new Date();
  const localDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  dateInput.min = localDate;

  // IMAGE PREVIEW
  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];

    if (previewURL) {
      URL.revokeObjectURL(previewURL);
      previewURL = null;
    }

    previewBox.hidden = true;
    previewImg.removeAttribute("src");

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
      setMessage("Please select a JPG, PNG or WebP image.", true);
      imageInput.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("The image must be smaller than 5 MB.", true);
      imageInput.value = "";
      return;
    }

    previewURL = URL.createObjectURL(file);
    previewImg.src = previewURL;
    previewBox.hidden = false;

    setMessage("Reference image selected successfully.");
  });

  // REMOVE IMAGE
  removeImage.addEventListener("click", () => {
    imageInput.value = "";
    previewImg.removeAttribute("src");
    previewBox.hidden = true;

    if (previewURL) {
      URL.revokeObjectURL(previewURL);
      previewURL = null;
    }

    setMessage("Reference image removed.");
  });

  // SUBMIT CUSTOM ORDER
  form.addEventListener("submit", event => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const getValue = id =>
      document.getElementById(id).value.trim();

    const shoeType = getValue("customShoeType");
    const shoeSize = getValue("customShoeSize");
    const color = getValue("customColor");
    const material = getValue("customMaterial");
    const quantity = getValue("customQuantity");
    const budget = getValue("customBudget");
    const description = getValue("customDescription");

    const name = getValue("customName");
    const phone = getValue("customPhone");
    const email = getValue("customEmail");
    const deliveryDate = getValue("customDate");
    const address = getValue("customAddress");

    if (!/^\d{7,15}$/.test(CUSTOM_WHATSAPP_NUMBER)) {
      setMessage(
        "Please configure the SoleCraft WhatsApp business number in main.js.",
        true
      );
      return;
    }

    const hasImage = imageInput.files.length > 0;

    const message = [
      "*SOLECRAFT CUSTOM SHOE REQUEST*",
      "",
      "*SHOE DETAILS*",
      `Shoe Type: ${shoeType}`,
      `Shoe Size: EU ${shoeSize}`,
      `Color: ${color}`,
      `Material: ${material}`,
      `Quantity: ${quantity}`,
      `Budget: ${budget || "Not specified"}`,
      "",
      "*DESIGN DESCRIPTION*",
      description,
      "",
      "*CUSTOMER INFORMATION*",
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Email: ${email || "Not provided"}`,
      `Preferred Delivery Date: ${deliveryDate || "Flexible"}`,
      `Delivery Location: ${address}`,
      "",
      hasImage
        ? "I have a reference image and will attach it in this chat."
        : "No reference image selected.",
      "",
      "Please confirm the design, quotation and production timeline."
    ].join("\n");

    const whatsappURL =
      `https://wa.me/${CUSTOM_WHATSAPP_NUMBER}?text=${
        encodeURIComponent(message)
      }`;

    // Open WhatsApp. Customer must press Send.
    window.open(whatsappURL, "_blank", "noopener,noreferrer");

    setMessage(
      hasImage
        ? "WhatsApp opened. Send the message and attach your reference image manually."
        : "WhatsApp opened. Please press Send to submit your request."
    );
  });

});



/* ==========================================
   SOLECRAFT CONTACT PAGE
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {

  const contactForm =
    document.getElementById("solecraftContactForm");

  // Only run this code on contact.html
  if (!contactForm) return;

  // ========================================
  // BUSINESS CONTACT SETTINGS
  // ========================================

  // Replace these with your actual business details.
  const BUSINESS_WHATSAPP = "2348147832045";
  const BUSINESS_PHONE = "2348147832045";
  const BUSINESS_EMAIL = "nanaaisha780@gmail.com";
  const BUSINESS_ADDRESS = "Lokoja";

  // ========================================
  // DISPLAY CONTACT INFORMATION
  // ========================================

  const phoneLink =
    document.getElementById("contactPhoneLink");

  const emailLink =
    document.getElementById("contactEmailLink");

  const locationText =
    document.getElementById("contactLocationText");

  const locationDisplay =
    document.getElementById("contactLocationDisplay");

  const directionsLink =
    document.getElementById("contactDirectionsLink");

  const whatsappButton =
    document.getElementById("contactWhatsAppButton");

  if (BUSINESS_PHONE) {
    phoneLink.textContent = BUSINESS_PHONE;
    phoneLink.href = `tel:${BUSINESS_PHONE.replace(/[^\d+]/g, "")}`;
  } else {
    phoneLink.removeAttribute("href");
  }

  if (BUSINESS_EMAIL) {
    emailLink.textContent = BUSINESS_EMAIL;
    emailLink.href = `mailto:${BUSINESS_EMAIL}`;
  } else {
    emailLink.removeAttribute("href");
  }

  if (BUSINESS_ADDRESS) {
    locationText.textContent = BUSINESS_ADDRESS;
    locationDisplay.textContent = BUSINESS_ADDRESS;

    directionsLink.href =
      `https://www.google.com/maps/search/?api=1&query=${
        encodeURIComponent(BUSINESS_ADDRESS)
      }`;

    directionsLink.hidden = false;
    directionsLink.target = "_blank";
    directionsLink.rel = "noopener noreferrer";
  }

  // ========================================
  // WHATSAPP BUTTON
  // ========================================

  const whatsappIsValid = /^\d{7,15}$/.test(BUSINESS_WHATSAPP);

  if (whatsappIsValid) {
    const greeting = "Hello SoleCraft, I would like to make an enquiry.";

    whatsappButton.href =
      `https://wa.me/${BUSINESS_WHATSAPP}?text=${
        encodeURIComponent(greeting)
      }`;

    whatsappButton.target = "_blank";
    whatsappButton.rel = "noopener noreferrer";
  } else {
    whatsappButton.removeAttribute("href");
    whatsappButton.title = "WhatsApp contact is not configured";
    whatsappButton.setAttribute("aria-disabled", "true");
  }

  // ========================================
  // PREVENT PLACEHOLDER SOCIAL LINKS
  // ========================================

  document.querySelectorAll(
    '[data-social-placeholder="true"]'
  ).forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      alert("This social media link has not been added yet.");
    });
  });

  // ========================================
  // CONTACT FORM SUBMISSION
  // ========================================

  const status =
    document.getElementById("contactFormStatus");

  contactForm.addEventListener("submit", event => {
    event.preventDefault();

    status.textContent = "";

    if (!contactForm.reportValidity()) return;

    if (!whatsappIsValid) {
      status.textContent =
        "Please configure the business WhatsApp number in main.js.";
      status.style.color = "#b42318";
      return;
    }

    const getValue = id =>
      document.getElementById(id).value.trim();

    const name = getValue("contactName");
    const phone = getValue("contactPhone");
    const email = getValue("contactEmail");
    const subject = getValue("contactSubject");
    const message = getValue("contactMessage");

    const whatsappMessage = [
      "*SOLECRAFT CONTACT ENQUIRY*",
      "",
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Email: ${email}`,
      `Enquiry Type: ${subject}`,
      "",
      "*MESSAGE*",
      message,
      "",
      "Thank you."
    ].join("\n");

    const url =
      `https://wa.me/${BUSINESS_WHATSAPP}?text=${
        encodeURIComponent(whatsappMessage)
      }`;

    window.open(url, "_blank", "noopener,noreferrer");

    status.style.color = "#28734a";
    status.textContent =
      "WhatsApp has been opened. Please press Send to submit your message.";
  });

});
