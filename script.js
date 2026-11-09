
"use strict";

const $ = id => document.getElementById(id);

const departments = [
  "College of Computer Studies",
  "College of Engineering",
  "College of Nursing",
  "College of Education",
  "College of Business and Accountancy",
  "College of Hospitality Management",
  "College of Arts and Sciences"
];

const products = [
  {id:1,name:"School Notebook",price:45,category:"Supplies",dept:"All",icon:"📓",stock:30},
  {id:2,name:"Ballpen Set",price:60,category:"Supplies",dept:"All",icon:"🖊️",stock:40},
  {id:3,name:"School ID Lace",price:75,category:"Accessories",dept:"All",icon:"🎫",stock:25},
  {id:4,name:"USB Flash Drive 32GB",price:250,category:"Accessories",dept:"College of Computer Studies",icon:"💾",stock:15},
  {id:5,name:"Programming Book",price:450,category:"Books",dept:"College of Computer Studies",icon:"📘",stock:10},
  {id:6,name:"Scientific Calculator",price:650,category:"Supplies",dept:"College of Engineering",icon:"🧮",stock:12},
  {id:7,name:"Engineering Drawing Set",price:320,category:"Supplies",dept:"College of Engineering",icon:"📐",stock:15},
  {id:8,name:"Nursing Scrubs",price:850,category:"Uniforms",dept:"College of Nursing",icon:"🥼",stock:20},
  {id:9,name:"Stethoscope",price:550,category:"Supplies",dept:"College of Nursing",icon:"🩺",stock:10},
  {id:10,name:"Teaching Materials Kit",price:280,category:"Supplies",dept:"College of Education",icon:"📚",stock:18},
  {id:11,name:"Accounting Workbook",price:390,category:"Books",dept:"College of Business and Accountancy",icon:"📗",stock:15},
  {id:12,name:"Chef Apron",price:350,category:"Uniforms",dept:"College of Hospitality Management",icon:"👨‍🍳",stock:20},
  {id:13,name:"Laboratory Goggles",price:180,category:"Supplies",dept:"College of Arts and Sciences",icon:"🥽",stock:20}
];

const STORE_KEY = "uneeds_demo_v1";

function loadStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
  } catch {
    return {};
  }
}

const saved = loadStore();

let student = saved.student || null;
let cart = saved.cart || [];
let orders = saved.orders || [];
let activeDept = "All";
let checkout = null;

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify({
    student, cart, orders
  }));
}

function money(value) {
  return "₱" + Number(value).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  })[char]);
}

function productById(id) {
  return products.find(p => p.id === Number(id));
}

function reservedQuantity(id) {
  return cart.find(item => item.id === id)?.qty || 0;
}

function cartTotal() {
  return cart.reduce((sum,item) => {
    const product = productById(item.id);
    return sum + (product ? product.price * item.qty : 0);
  }, 0);
}

function availableStock(product) {
  const sold = orders.reduce((sum,order) => {
    if (order.status === "Cancelled") return sum;
    const item = order.items.find(i => i.id === product.id);
    return sum + (item?.qty || 0);
  }, 0);

  return Math.max(0, product.stock - sold);
}

// Navigation

document.querySelectorAll(".tab").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(tab => {
      tab.classList.toggle("on", tab === button);
    });

    ["shop","orders","about"].forEach(view => {
      $("v-" + view).hidden = button.dataset.v !== view;
    });

    if (button.dataset.v === "orders") renderOrders();
  });
});

// Student login

function initializeLogin() {
  $("dept").innerHTML = departments.map(dept =>
    `<option value="${escapeHTML(dept)}">${escapeHTML(dept)}</option>`
  ).join("");

  if (!student) {
    $("login").showModal();
  }

  updateStudent();
}

function updateStudent() {
  $("who").textContent = student
    ? "🎓 " + student.number
    : "Guest";
}

$("go").addEventListener("click", () => {
  const number = $("sn").value.trim();
  const dept = $("dept").value;

  if (!number) {
    alert("Please enter your student number.");
    return;
  }

  student = {number,dept};
  save();
  updateStudent();
  $("login").close();
  renderChips();
  renderProducts();
});

$("sn").addEventListener("keydown", event => {
  if (event.key === "Enter") $("go").click();
});

$("login").addEventListener("cancel", event => {
  if (!student) event.preventDefault();
});

// Product categories

function initializeCategories() {
  const categories = [...new Set(products.map(p => p.category))];

  $("cat").innerHTML =
    '<option value="">All categories</option>' +
    categories.map(category =>
      `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`
    ).join("");
}

function renderChips() {
  const options = ["All", ...departments];

  $("chips").innerHTML = options.map(dept => `
    <button class="chip ${activeDept === dept ? "on" : ""}"
      data-dept="${escapeHTML(dept)}">
      ${escapeHTML(dept)}
    </button>
  `).join("");
}

$("chips").addEventListener("click", event => {
  const button = event.target.closest("[data-dept]");
  if (!button) return;

  activeDept = button.dataset.dept;
  renderChips();
  renderProducts();
});

$("q").addEventListener("input", renderProducts);
$("cat").addEventListener("change", renderProducts);

function renderProducts() {
  const query = $("q").value.toLowerCase().trim();
  const category = $("cat").value;

  const filtered = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(query);
    const matchesCategory = !category || product.category === category;
    const matchesDept = activeDept === "All" ||
      product.dept === "All" || product.dept === activeDept;

    return matchesSearch && matchesCategory && matchesDept;
  });

  if (!filtered.length) {
    $("grid").innerHTML = '<div class="box">No products found.</div>';
    return;
  }

  $("grid").innerHTML = filtered.map(product => {
    const stock = availableStock(product);
    const canAdd = stock > reservedQuantity(product.id);

    return `
      <div class="card">
        <div class="em">${product.icon}</div>
        <b>${escapeHTML(product.name)}</b>
        <span class="tag">${escapeHTML(product.category)}</span>
        <span class="tag">${escapeHTML(product.dept)}</span>
        <span class="pr">${money(product.price)}</span>
        <span class="note">${stock} available</span>
        <button class="btn" data-add="${product.id}"
          ${canAdd ? "" : "disabled"}>
          ${canAdd ? "Add to Cart" : "Unavailable"}
        </button>
      </div>
    `;
  }).join("");
}

$("grid").addEventListener("click", event => {
  const button = event.target.closest("[data-add]");
  if (button) addToCart(Number(button.dataset.add));
});

// Shopping cart

function addToCart(id) {
  const product = productById(id);
  if (!product) return;

  const existing = cart.find(item => item.id === id);
  const quantity = existing?.qty || 0;

  if (quantity >= availableStock(product)) {
    alert("Not enough stock available.");
    return;
  }

  if (existing) existing.qty++;
  else cart.push({id,qty:1});

  save();
  updateCartButton();
  renderProducts();
}

function updateCartButton() {
  const count = cart.reduce((sum,item) => sum + item.qty, 0);
  $("cartBtn").textContent = `🛒 Cart (${count})`;
}

function renderCart() {
  if (!cart.length) {
    $("clines").innerHTML = "<p>Your cart is empty.</p>";
  } else {
    $("clines").innerHTML = cart.map(item => {
      const product = productById(item.id);
      if (!product) return "";

      return `
        <div class="row">
          <div>
            <b>${escapeHTML(product.name)}</b>
            <div class="note">${money(product.price)} each</div>
          </div>
          <div class="q" style="display:flex;align-items:center;gap:7px">
            <button data-minus="${item.id}">−</button>
            <span>${item.qty}</span>
            <button data-plus="${item.id}">+</button>
            <button data-remove="${item.id}">×</button>
          </div>
        </div>
      `;
    }).join("");
  }

  $("sub").textContent = money(cartTotal());
  $("co").disabled = cart.length === 0;
}

$("cartBtn").addEventListener("click", () => {
  renderCart();
  $("cartD").showModal();
});

$("cc").addEventListener("click", () => $("cartD").close());

$("clines").addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;

  const id = Number(
    button.dataset.plus ||
    button.dataset.minus ||
    button.dataset.remove
  );

  const item = cart.find(i => i.id === id);
  if (!item) return;

  if (button.hasAttribute("data-plus")) {
    const product = productById(id);

    if (item.qty >= availableStock(product)) {
      alert("Maximum available stock reached.");
      return;
    }
    item.qty++;
  }

  if (button.hasAttribute("data-minus")) item.qty--;

  if (button.hasAttribute("data-remove")) item.qty = 0;

  cart = cart.filter(i => i.qty > 0);

  save();
  renderCart();
  updateCartButton();
  renderProducts();
});

// Checkout

$("co").addEventListener("click", () => {
  if (!student) {
    $("cartD").close();
    $("login").showModal();
    return;
  }

  if (!cart.length) return;

  for (const item of cart) {
    const product = productById(item.id);
    if (!product || item.qty > availableStock(product)) {
      alert("Some items are no longer available. Please update your cart.");
      return;
    }
  }

  checkout = {
    step:1,
    fulfillment:"Pickup",
    address:"",
    payment:"GCash",
    total:cartTotal()
  };

  $("cartD").close();
  renderCheckout();
  $("chk").showModal();
});

function checkoutSteps(step) {
  return `
    <div class="steps">
      ${[1,2,3].map(n =>
        `<div class="st ${n <= step ? "d" : ""}"></div>`
      ).join("")}
    </div>
    <p class="note">Step ${step} of 3</p>
  `;
}

function renderCheckout() {
  if (!checkout) return;

  if (checkout.step === 1) renderFulfillment();
  if (checkout.step === 2) renderPayment();
  if (checkout.step === 3) renderConfirmation();
}

function renderFulfillment() {
  $("chkb").innerHTML = `
    <h2>Checkout</h2>
    ${checkoutSteps(1)}
    <h3>Delivery or Pickup</h3>

    <label class="opt">
      <input type="radio" name="fulfillment" value="Pickup"
        ${checkout.fulfillment === "Pickup" ? "checked" : ""}>
      Pickup at Campus
    </label>

    <label class="opt" style="margin-top:8px">
      <input type="radio" name="fulfillment" value="Delivery"
        ${checkout.fulfillment === "Delivery" ? "checked" : ""}>
      Local Delivery
    </label>

    <div id="deliveryFields" class="f" style="margin-top:12px"
      ${checkout.fulfillment === "Pickup" ? "hidden" : ""}>
      <label>Delivery Address
        <input id="deliveryAddress" placeholder="Enter delivery address"
          value="${escapeHTML(checkout.address)}">
      </label>
    </div>

    <div class="row">
      <b>Order Total</b>
      <b>${money(checkout.total)}</b>
    </div>

    <div class="pay-actions">
      <button class="btn g" id="cancelCheckout">Cancel</button>
      <button class="btn" id="nextCheckout">Continue</button>
    </div>
  `;

  document.querySelectorAll('input[name="fulfillment"]').forEach(radio => {
    radio.addEventListener("change", () => {
      checkout.fulfillment = radio.value;
      $("deliveryFields").hidden = radio.value !== "Delivery";
    });
  });

  $("cancelCheckout").onclick = () => $("chk").close();

  $("nextCheckout").onclick = () => {
    if (checkout.fulfillment === "Delivery") {
      checkout.address = $("deliveryAddress").value.trim();

      if (!checkout.address) {
        alert("Please enter your delivery address.");
        return;
      }
    }

    checkout.step = 2;
    renderCheckout();
  };
}

// Payment selection

function renderPayment() {
  $("chkb").innerHTML = `
    <h2>Payment Checkout</h2>
    ${checkoutSteps(2)}

    <div class="pm">
      <b>UNeeds Payment Simulation</b>
      <div><small>Demo checkout — not connected to PayMongo</small></div>
    </div>

    <div class="pay-summary">
      <div class="row">
        <span>Payment Amount</span>
        <b>${money(checkout.total)}</b>
      </div>
      <div class="row">
        <span>Order Method</span>
        <span>${escapeHTML(checkout.fulfillment)}</span>
      </div>
    </div>

    <h3>Choose Payment Method</h3>

    <div class="pay-methods">
      <label class="pay-option">
        <input type="radio" name="payment" value="GCash"
          ${checkout.payment === "GCash" ? "checked" : ""}>
        <div>
          <strong>GCash</strong>
          <small>Simulated e-wallet payment</small>
        </div>
      </label>

      <label class="pay-option">
        <input type="radio" name="payment" value="Maya"
          ${checkout.payment === "Maya" ? "checked" : ""}>
        <div>
          <strong>Maya</strong>
          <small>Simulated e-wallet payment</small>
        </div>
      </label>

      <label class="pay-option">
        <input type="radio" name="payment" value="Card"
          ${checkout.payment === "Card" ? "checked" : ""}>
        <div>
          <strong>Credit / Debit Card</strong>
          <small>Simulated card payment</small>
        </div>
      </label>
    </div>

    <div class="pay-field" id="walletFields">
      <label>Demo Mobile Number</label>
      <input id="walletNumber" type="tel"
        placeholder="09XXXXXXXXX" maxlength="11">
    </div>

    <div id="cardFields" hidden>
      <p class="note">
        Demo only. Never enter real card information.
      </p>
      <div class="pay-field">
        <label>Demo Cardholder Name</label>
        <input id="cardName" placeholder="Demo Student">
      </div>
      <div class="pay-field">
        <label>Dummy Card Number</label>
        <input id="cardNumber" placeholder="1111222233334444"
          maxlength="16" inputmode="numeric">
      </div>
    </div>

    <p id="paymentError" class="pay-error"></p>

    <div class="pay-actions">
      <button class="btn g" id="backCheckout">Back</button>
      <button class="btn" id="payNow">
        Simulate Payment ${money(checkout.total)}
      </button>
    </div>

    <p class="pay-demo">
      No real money will be transferred.
      Do not enter actual financial credentials.
    </p>
  `;

  function togglePayment() {
    const method = document.querySelector(
      'input[name="payment"]:checked'
    ).value;

    checkout.payment = method;
    $("walletFields").hidden = method === "Card";
    $("cardFields").hidden = method !== "Card";
    $("paymentError").textContent = "";
  }

  document.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener("change", togglePayment);
  });

  togglePayment();

  $("backCheckout").onclick = () => {
    checkout.step = 1;
    renderCheckout();
  };

  $("payNow").onclick = processPayment;
}

function processPayment() {
  const method = checkout.payment;

  if (method === "Card") {
    const name = $("cardName").value.trim();
    const number = $("cardNumber").value.trim();

    if (!name || !/^\d{16}$/.test(number)) {
      $("paymentError").textContent =
        "Enter a demo name and 16-digit dummy card number.";
      return;
    }
  } else {
    const number = $("walletNumber").value.trim();

    if (!/^09\d{9}$/.test(number)) {
      $("paymentError").textContent =
        "Enter a valid 11-digit demo mobile number.";
      return;
    }
  }

  // Demo credentials are never saved.
  $("chkb").innerHTML = `
    <div class="pay-processing">
      <div class="pay-spinner"></div>
      <h2>Processing Demo Payment...</h2>
      <p class="note">Please wait a moment.</p>
    </div>
  `;

  setTimeout(() => {
    const validStock = cart.every(item => {
      const product = productById(item.id);
      return product && item.qty <= availableStock(product);
    });

    if (!validStock) {
      $("chkb").innerHTML = `
        <h3>Checkout could not be completed</h3>
        <p>Some products are no longer available.</p>
        <button class="btn" id="returnShop">Return to Shop</button>
      `;
      $("returnShop").onclick = () => $("chk").close();
      return;
    }

    const order = {
      id:"UN-" + Date.now(),
      student:student.number,
      department:student.dept,
      items:cart.map(item => ({
        id:item.id,
        name:productById(item.id).name,
        price:productById(item.id).price,
        qty:item.qty
      })),
      total:checkout.total,
      fulfillment:checkout.fulfillment,
      address:checkout.fulfillment === "Delivery"
        ? checkout.address : "Campus Pickup",
      payment:method,
      status:"Pending",
      paymentStatus:"Paid (Demo)",
      date:new Date().toLocaleString("en-PH")
    };

    orders.unshift(order);
    cart = [];
    checkout.order = order;
    checkout.step = 3;

    save();
    updateCartButton();
    renderProducts();
    renderCheckout();
  }, 1800);
}

// Confirmation

function renderConfirmation() {
  const order = checkout.order;

  $("chkb").innerHTML = `
    <div class="pay-success">
      <div class="pay-success-icon">✓</div>
      <h2>Demo Payment Successful!</h2>
      <p>Your simulated payment was completed.</p>
    </div>

    ${checkoutSteps(3)}

    <div class="pay-receipt">
      <h3>UNeeds Demo Receipt</h3>

      <div class="row">
        <span>Order Number</span>
        <b>${escapeHTML(order.id)}</b>
      </div>

      <div class="row">
        <span>Payment Method</span>
        <b>${escapeHTML(order.payment)}</b>
      </div>

      <div class="row">
        <span>Amount Paid</span>
        <b>${money(order.total)}</b>
      </div>

      <div class="row">
        <span>Payment Status</span>
        <span class="ok">Paid (Demo)</span>
      </div>

      <div class="row">
        <span>Order Status</span>
        <b>${escapeHTML(order.status)}</b>
      </div>

      <div class="row">
        <span>Date</span>
        <small>${escapeHTML(order.date)}</small>
      </div>

      <p class="pay-demo">
        DEMO RECEIPT — NOT VALID PROOF OF PAYMENT
      </p>
    </div>

    <button class="btn" id="finishCheckout"
      style="width:100%">View My Orders</button>
  `;

  $("finishCheckout").onclick = () => {
    $("chk").close();
    document.querySelector('[data-v="orders"]').click();
  };
}

// My Orders

function renderOrders() {
  const myOrders = student
    ? orders.filter(order => order.student === student.number)
    : [];

  if (!myOrders.length) {
    $("olist").innerHTML = `
      <div class="box">
        <p>You have no orders yet.</p>
      </div>
    `;
    return;
  }

  $("olist").innerHTML = myOrders.map(order => `
    <div class="box">
      <div class="row">
        <b>${escapeHTML(order.id)}</b>
        <span class="ok">${escapeHTML(order.paymentStatus)}</span>
      </div>

      <p class="note">${escapeHTML(order.date)}</p>

      ${order.items.map(item => `
        <div class="row">
          <span>${escapeHTML(item.name)} × ${item.qty}</span>
          <span>${money(item.price * item.qty)}</span>
        </div>
      `).join("")}

      <div class="row">
        <b>Total</b>
        <b>${money(order.total)}</b>
      </div>

      <p><b>Payment:</b> ${escapeHTML(order.payment)}</p>
      <p><b>Fulfillment:</b> ${escapeHTML(order.fulfillment)}</p>
      <p><b>Order Status:</b> ${escapeHTML(order.status)}</p>
      <p class="note">Simulated transaction only.</p>
    </div>
  `).join("");
}

// Start application

initializeCategories();
initializeLogin();
renderChips();
renderProducts();
updateCartButton();