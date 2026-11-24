// =====================================
// 1. SHARED SETTINGS
// =====================================

const PRODUCT_STORAGE_KEY = "imsProducts";
const USER_STORAGE_KEY = "imsUser";

const LOW_STOCK_LIMIT = 5;

const LOCATION_KEY = "imsLocations";
const SUPPLIER_KEY = "imsSuppliers";
const INVOICE_KEY = "imsInvoices";
const COUNT_KEY = "imsCycleCounts";

const GST_RATE = 0.05;


// =====================================
// 2. LOCAL STORAGE FUNCTIONS
// =====================================

function readList(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key) || "[]");

        return Array.isArray(value) ? value : [];
    }
    catch (error) {
        return [];
    }
}


function writeList(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    }
    catch (error) {
        return false;
    }
}


function getProducts() {
    return readList(PRODUCT_STORAGE_KEY);
}


function saveProducts(products) {
    return writeList(PRODUCT_STORAGE_KEY, products);
}


// =====================================
// 3. HELPER FUNCTIONS
// =====================================

function makeProductId() {
    return window.crypto && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()) + Math.random().toString(16).slice(2);
}


function formatPrice(price) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(Number(price) || 0);
}


function stockLabel(quantity) {
    return Number(quantity) <= LOW_STOCK_LIMIT
        ? "Low stock"
        : "In stock";
}


function addTextCell(row, value) {
    const cell = document.createElement("td");

    cell.textContent =
        value == null || value === ""
            ? "—"
            : value;

    row.appendChild(cell);

    return cell;
}


function addStockCell(row, quantity) {
    const cell = document.createElement("td");

    const tag = document.createElement("span");

    tag.className =
        Number(quantity) <= LOW_STOCK_LIMIT
            ? "stock-tag low"
            : "stock-tag";

    tag.textContent = stockLabel(quantity);

    cell.appendChild(tag);
    row.appendChild(cell);
}


function showMessage(element, message, isError) {
    if (!element) return;

    element.textContent = message;

    element.classList.toggle("error", Boolean(isError));
}


function daysUntil(dateText) {
    if (!dateText) return null;

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const date = new Date(dateText + "T00:00:00");

    return Math.ceil((date - today) / 86400000);
}


// =====================================
// 4. ACCOUNT CREATION
// =====================================

// This is a front-end demonstration.
// Passwords are not saved or authenticated.

const signupForm = document.getElementById("signupForm");

if (signupForm) {

    signupForm.addEventListener("submit", function(event) {

        event.preventDefault();

        const name =
            document.getElementById("userName").value.trim();

        const email =
            document.getElementById("userEmail").value.trim();

        if (
            !name ||
            !email ||
            !document.getElementById("termsAccepted").checked
        ) {
            return;
        }

        try {
            localStorage.setItem(
                USER_STORAGE_KEY,
                JSON.stringify({
                    name: name,
                    email: email
                })
            );
        }
        catch (error) {}

        window.location.href = "dashboard.html";

    });


    const passwordInput =
        document.getElementById("password");

    const togglePassword =
        document.getElementById("togglePassword");


    if (passwordInput && togglePassword) {

        togglePassword.addEventListener("click", function() {

            const showing = passwordInput.type === "text";

            passwordInput.type =
                showing ? "password" : "text";

            togglePassword.setAttribute(
                "aria-label",
                showing ? "Show password" : "Hide password"
            );

        });

    }
}


// =====================================
// 5. DASHBOARD
// =====================================

function updateDashboard() {

    const totalItems =
        document.getElementById("totalItems");

    if (!totalItems) return;

    const products = getProducts();

    totalItems.textContent = products.length;


    document.getElementById("lowStockItems").textContent =
        products.filter(
            p => Number(p.quantity) <= LOW_STOCK_LIMIT
        ).length;


    const locations = readList(LOCATION_KEY);

    document.getElementById("totalLocations").textContent =
        Math.max(1, locations.length);


    try {

        const user = JSON.parse(
            localStorage.getItem(USER_STORAGE_KEY) || "null"
        );

        if (user && user.name) {

            document.getElementById("welcomeName").textContent =
                ", " + user.name;

        }

    }
    catch (error) {}

}


// =====================================
// 6. INVENTORY MANAGEMENT
// =====================================

const productForm =
    document.getElementById("productForm");

const inventoryBody =
    document.getElementById("inventoryBody");


function renderInventory() {

    if (!inventoryBody) return;

    const products = getProducts();

    const empty =
        document.getElementById("inventoryEmpty");

    const wrap =
        document.getElementById("inventoryTableWrap");


    inventoryBody.textContent = "";


    document.getElementById("inventoryCount").textContent =
        products.length +
        (products.length === 1 ? " item" : " items");


    empty.hidden = products.length > 0;

    wrap.hidden = products.length === 0;


    products.forEach(function(product) {

        const row = document.createElement("tr");


        addTextCell(row, product.name);

        addTextCell(row, product.category);

        addTextCell(row, product.quantity);


        addTextCell(
            row,
            (product.batchId || "—") +
            " / " +
            (product.aisle || "—")
        );


        const expiry =
            product.expiryDate
                ? product.expiryDate
                : "—";

        addTextCell(row, expiry);

        addTextCell(row, formatPrice(product.price));

        addStockCell(row, product.quantity);


        const actionCell =
            document.createElement("td");

        const actions =
            document.createElement("div");

        actions.className = "table-actions";


        ["edit", "delete"].forEach(function(action) {

            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "small-button" +
                (action === "delete" ? " delete" : "");

            button.textContent =
                action === "edit" ? "Edit" : "Delete";

            button.dataset.action = action;

            button.dataset.id = product.id;

            actions.appendChild(button);

        });


        actionCell.appendChild(actions);

        row.appendChild(actionCell);

        inventoryBody.appendChild(row);

    });

}


if (productForm) {

    const idInput =
        document.getElementById("productId");

    const nameInput =
        document.getElementById("productName");

    const categoryInput =
        document.getElementById("category");

    const quantityInput =
        document.getElementById("quantity");

    const priceInput =
        document.getElementById("price");


    const batchInput =
        document.getElementById("batchId");

    const aisleInput =
        document.getElementById("aisle");

    const locationInput =
        document.getElementById("locationName");

    const expiryInput =
        document.getElementById("expiryDate");


    const saveButton =
        document.getElementById("saveProductButton");

    const cancelButton =
        document.getElementById("cancelEditButton");

    const heading =
        document.getElementById("formHeading");

    const message =
        document.getElementById("formMessage");


    function resetProductForm() {

        productForm.reset();

        idInput.value = "";

        if (locationInput) {
            locationInput.value = "Main warehouse";
        }

        saveButton.textContent = "Add product";

        cancelButton.hidden = true;

        heading.textContent = "Add a product";

    }


    // Add or update a product.

    productForm.addEventListener("submit", function(event) {

        event.preventDefault();


        const name = nameInput.value.trim();

        const category = categoryInput.value.trim();

        const qText = quantityInput.value;

        const pText = priceInput.value;


        const quantity = Number(qText);

        const price = Number(pText);


        if (
            !name ||
            !category ||
            qText === "" ||
            pText === "" ||
            !Number.isInteger(quantity) ||
            quantity < 0 ||
            !Number.isFinite(price) ||
            price < 0
        ) {

            showMessage(
                message,
                "Enter a name, category, whole quantity and valid non-negative price.",
                true
            );

            return;

        }


        let products = getProducts();

        const editingId = idInput.value;


        const details = {

            name,
            category,
            quantity,
            price,

            batchId:
                batchInput ? batchInput.value.trim() : "",

            aisle:
                aisleInput ? aisleInput.value.trim() : "",

            location:
                locationInput
                    ? locationInput.value.trim()
                    : "Main warehouse",

            expiryDate:
                expiryInput ? expiryInput.value : ""

        };


        if (editingId) {

            products = products.map(p =>
                p.id === editingId
                    ? Object.assign({}, p, details)
                    : p
            );

        }
        else {

            products.push(
                Object.assign(
                    { id: makeProductId() },
                    details
                )
            );

        }


        if (!saveProducts(products)) {

            showMessage(
                message,
                "Could not save data. Check browser storage settings.",
                true
            );

            return;

        }


        resetProductForm();

        showMessage(
            message,
            editingId
                ? "Product updated."
                : "Product added.",
            false
        );


        renderInventory();

        updateDashboard();

    });


    // Edit and delete products.

    inventoryBody.addEventListener("click", function(event) {

        const button =
            event.target.closest("button[data-action]");

        if (!button) return;


        const id = button.dataset.id;

        let products = getProducts();

        const selected =
            products.find(p => p.id === id);

        if (!selected) return;


        if (button.dataset.action === "edit") {

            idInput.value = selected.id;

            nameInput.value = selected.name;

            categoryInput.value = selected.category;

            quantityInput.value = selected.quantity;

            priceInput.value = selected.price;


            if (batchInput) {
                batchInput.value = selected.batchId || "";
            }

            if (aisleInput) {
                aisleInput.value = selected.aisle || "";
            }

            if (locationInput) {
                locationInput.value =
                    selected.location || "Main warehouse";
            }

            if (expiryInput) {
                expiryInput.value = selected.expiryDate || "";
            }


            saveButton.textContent = "Save changes";

            cancelButton.hidden = false;

            heading.textContent = "Edit product";


            showMessage(
                message,
                "Update the details and choose Save changes.",
                false
            );

            nameInput.focus();

        }


        else if (
            button.dataset.action === "delete" &&
            window.confirm(
                "Delete " + selected.name + " from inventory?"
            )
        ) {

            products = products.filter(p => p.id !== id);


            if (saveProducts(products)) {

                if (idInput.value === id) {
                    resetProductForm();
                }

                showMessage(
                    message,
                    "Product deleted.",
                    false
                );

                renderInventory();

                updateDashboard();

            }
            else {

                showMessage(
                    message,
                    "Could not delete this product.",
                    true
                );

            }

        }

    });


    cancelButton.addEventListener("click", function() {

        resetProductForm();

        showMessage(
            message,
            "Edit cancelled.",
            false
        );

    });


    renderInventory();

}


// =====================================
// 7. PRODUCT SEARCH
// =====================================

const searchForm =
    document.getElementById("searchForm");


if (searchForm) {

    const searchInput =
        document.getElementById("productSearch");

    const categoryFilter =
        document.getElementById("categoryFilter");


    function renderSearchResults() {

        const products = getProducts();

        const query =
            searchInput.value.trim().toLowerCase();

        const categoryQuery =
            categoryFilter
                ? categoryFilter.value.trim().toLowerCase()
                : "";


        const matches = products.filter(p =>

            p.name.toLowerCase().includes(query) &&

            String(p.category)
                .toLowerCase()
                .includes(categoryQuery)

        );


        const body =
            document.getElementById("searchResultsBody");

        const empty =
            document.getElementById("searchEmpty");

        const wrap =
            document.getElementById("searchTableWrap");


        body.textContent = "";


        document.getElementById("resultCount").textContent =
            matches.length + " found";


        wrap.hidden = matches.length === 0;

        empty.hidden = matches.length > 0;


        empty.textContent =
            products.length === 0
                ? "No products yet. Add products to your inventory first."
                : "No matching products found. Try another search.";


        matches.forEach(p => {

            const row = document.createElement("tr");

            addTextCell(row, p.name);

            addTextCell(row, p.category);

            addTextCell(row, p.quantity);

            addTextCell(row, p.aisle);

            addTextCell(row, formatPrice(p.price));

            addStockCell(row, p.quantity);

            body.appendChild(row);

        });

    }


    searchForm.addEventListener("submit", e => {

        e.preventDefault();

        renderSearchResults();

    });


    searchInput.addEventListener(
        "input",
        renderSearchResults
    );


    if (categoryFilter) {

        categoryFilter.addEventListener(
            "input",
            renderSearchResults
        );

    }


    renderSearchResults();

}


// =====================================
// 8. WAREHOUSE LOCATIONS
// =====================================

const locationForm =
    document.getElementById("locationForm");


if (locationForm) {

    const name =
        document.getElementById("locationInput");

    const note =
        document.getElementById("locationNote");

    const list =
        document.getElementById("locationList");


    function renderLocations() {

        const items = readList(LOCATION_KEY);

        list.textContent = "";


        document.getElementById("locationCount").textContent =
            items.length + " locations";


        items.forEach(item => {

            const card =
                document.createElement("div");

            card.className = "simple-list-item";


            const text =
                document.createElement("span");

            text.textContent =
                item.name +
                (item.note ? " — " + item.note : "");


            const del =
                document.createElement("button");

            del.className = "small-button delete";

            del.textContent = "Delete";


            del.addEventListener("click", () => {

                writeList(
                    LOCATION_KEY,
                    readList(LOCATION_KEY).filter(
                        x => x.id !== item.id
                    )
                );

                renderLocations();

                updateDashboard();

            });


            card.append(text, del);

            list.appendChild(card);

        });

    }


    locationForm.addEventListener("submit", e => {

        e.preventDefault();

        const items = readList(LOCATION_KEY);


        if (
            items.some(
                x => x.name.toLowerCase() ===
                name.value.trim().toLowerCase()
            )
        ) {

            showMessage(
                document.getElementById("locationMessage"),
                "That location already exists.",
                true
            );

            return;

        }


        items.push({

            id: makeProductId(),

            name: name.value.trim(),

            note: note.value.trim()

        });


        writeList(LOCATION_KEY, items);

        locationForm.reset();

        renderLocations();

        updateDashboard();


        showMessage(
            document.getElementById("locationMessage"),
            "Location saved.",
            false
        );

    });


    renderLocations();

}


// =====================================
// 9. SUPPLIER MANAGEMENT
// =====================================

const supplierForm =
    document.getElementById("supplierForm");


if (supplierForm) {

    const list =
        document.getElementById("supplierList");


    function renderSuppliers() {

        const items = readList(SUPPLIER_KEY);

        list.textContent = "";


        document.getElementById("supplierCount").textContent =
            items.length + " suppliers";


        items.forEach(item => {

            const card =
                document.createElement("div");

            card.className = "simple-list-item";


            const text =
                document.createElement("span");

            text.textContent =
                item.name +
                " | " +
                (item.phone || "No phone") +
                " | " +
                (item.email || "No email");


            const del =
                document.createElement("button");

            del.className = "small-button delete";

            del.textContent = "Delete";


            del.addEventListener("click", () => {

                writeList(
                    SUPPLIER_KEY,
                    readList(SUPPLIER_KEY).filter(
                        x => x.id !== item.id
                    )
                );

                renderSuppliers();

            });


            card.append(text, del);

            list.appendChild(card);

        });

    }


    supplierForm.addEventListener("submit", e => {

        e.preventDefault();

        const items = readList(SUPPLIER_KEY);


        items.push({

            id: makeProductId(),

            name:
                document.getElementById("supplierName")
                    .value.trim(),

            phone:
                document.getElementById("supplierPhone")
                    .value.trim(),

            email:
                document.getElementById("supplierEmail")
                    .value.trim()

        });


        writeList(SUPPLIER_KEY, items);

        supplierForm.reset();

        renderSuppliers();


        showMessage(
            document.getElementById("supplierMessage"),
            "Supplier saved.",
            false
        );

    });


    renderSuppliers();

}


// =====================================
// 10. BILLING / POINT OF SALE
// =====================================

const billForm =
    document.getElementById("billForm");


if (billForm) {

    let cart = [];

    const productSelect =
        document.getElementById("billProduct");

    const quantityInput =
        document.getElementById("billQuantity");


    function loadBillProducts() {

        const products = getProducts();

        productSelect.innerHTML =
            '<option value="">Choose a product</option>';


        products.forEach(p => {

            const option =
                document.createElement("option");

            option.value = p.id;

            option.textContent =
                p.name +
                " (" +
                p.quantity +
                " available)";

            productSelect.appendChild(option);

        });

    }


    function renderBill() {

        const body =
            document.getElementById("billBody");

        body.textContent = "";

        let subtotal = 0;


        cart.forEach(item => {

            const line =
                item.price * item.quantity;

            subtotal += line;


            const row =
                document.createElement("tr");


            addTextCell(row, item.name);

            addTextCell(row, item.quantity);

            addTextCell(row, formatPrice(item.price));

            addTextCell(row, formatPrice(line));


            const cell =
                document.createElement("td");

            const remove =
                document.createElement("button");

            remove.className = "small-button delete";

            remove.textContent = "Remove";


            remove.addEventListener("click", () => {

                cart = cart.filter(
                    x => x.productId !== item.productId
                );

                renderBill();

            });


            cell.appendChild(remove);

            row.appendChild(cell);

            body.appendChild(row);

        });


        const tax = subtotal * GST_RATE;


        document.getElementById("billItemCount").textContent =
            cart.length + " items";


        document.getElementById("billSubtotal").textContent =
            formatPrice(subtotal);

        document.getElementById("billTax").textContent =
            formatPrice(tax);

        document.getElementById("billTotal").textContent =
            formatPrice(subtotal + tax);

    }


    function renderInvoices() {

        const list =
            document.getElementById("invoiceList");

        list.textContent = "";


        readList(INVOICE_KEY)
            .slice()
            .reverse()
            .slice(0, 8)
            .forEach(invoice => {

                const row =
                    document.createElement("div");

                row.className = "simple-list-item";


                const text =
                    document.createElement("span");

                text.textContent =
                    invoice.number +
                    " — " +
                    new Date(invoice.date).toLocaleString() +
                    " — " +
                    formatPrice(invoice.total);


                row.appendChild(text);

                list.appendChild(row);

            });


        if (!list.children.length) {

            list.textContent = "No completed invoices yet.";

        }

    }


    // Add a product to the temporary bill.

    billForm.addEventListener("submit", e => {

        e.preventDefault();


        const product =
            getProducts().find(
                p => p.id === productSelect.value
            );

        const quantity = Number(quantityInput.value);


        if (!product) {

            showMessage(
                document.getElementById("billMessage"),
                "Choose a product first.",
                true
            );

            return;

        }


        const alreadyInCart =
            cart.find(x => x.productId === product.id);


        const requested =
            quantity +
            (alreadyInCart ? alreadyInCart.quantity : 0);


        if (
            !Number.isInteger(quantity) ||
            quantity < 1 ||
            requested > Number(product.quantity)
        ) {

            showMessage(
                document.getElementById("billMessage"),
                "Quantity is greater than available stock.",
                true
            );

            return;

        }


        if (alreadyInCart) {

            alreadyInCart.quantity += quantity;

        }
        else {

            cart.push({

                productId: product.id,

                name: product.name,

                category: product.category,

                price: Number(product.price),

                quantity

            });

        }


        renderBill();


        showMessage(
            document.getElementById("billMessage"),
            "Item added to bill.",
            false
        );

    });


    // Complete the sale and deduct stock.

    document.getElementById("completeBill")
        .addEventListener("click", function() {


        if (!cart.length) {

            showMessage(
                document.getElementById("invoiceMessage"),
                "Add at least one item before completing the sale.",
                true
            );

            return;

        }


        let products = getProducts();


        for (const item of cart) {

            const product =
                products.find(
                    p => p.id === item.productId
                );


            if (
                !product ||
                Number(product.quantity) < item.quantity
            ) {

                showMessage(
                    document.getElementById("invoiceMessage"),
                    "Stock changed. Please review the bill and try again.",
                    true
                );

                loadBillProducts();

                return;

            }

        }


        const subtotal =
            cart.reduce(
                (sum, item) =>
                    sum + item.price * item.quantity,
                0
            );


        const tax = subtotal * GST_RATE;


        products = products.map(p => {

            const sold =
                cart.find(
                    item => item.productId === p.id
                );


            return sold

                ? Object.assign({}, p, {
                    quantity:
                        Number(p.quantity) - sold.quantity
                })

                : p;

        });


        if (!saveProducts(products)) {

            showMessage(
                document.getElementById("invoiceMessage"),
                "Could not update stock in browser storage.",
                true
            );

            return;

        }


        const invoices = readList(INVOICE_KEY);


        invoices.push({

            number: "INV-" + Date.now(),

            date: new Date().toISOString(),

            items: cart,

            subtotal,

            tax,

            total: subtotal + tax

        });


        writeList(INVOICE_KEY, invoices);


        cart = [];

        renderBill();

        renderInvoices();

        loadBillProducts();

        updateDashboard();


        showMessage(
            document.getElementById("invoiceMessage"),
            "Sale completed. Stock has been deducted.",
            false
        );

    });


    loadBillProducts();

    renderBill();

    renderInvoices();

}


// =====================================
// 11. STOCK AND EXPIRY ALERTS
// =====================================

if (document.getElementById("lowStockList")) {

    const products = getProducts();


    const low = products.filter(
        p => Number(p.quantity) <= LOW_STOCK_LIMIT
    );


    const expiring = products

        .filter(p => {

            const days = daysUntil(p.expiryDate);

            return days !== null && days <= 14;

        })

        .sort(
            (a, b) =>
                daysUntil(a.expiryDate) -
                daysUntil(b.expiryDate)
        );


    document.getElementById("alertLowCount").textContent =
        low.length;

    document.getElementById("alertExpiryCount").textContent =
        expiring.length;


    // Low-stock products.

    const lowList =
        document.getElementById("lowStockList");

    lowList.textContent = "";


    low.forEach(p => {

        const row =
            document.createElement("div");

        row.className = "simple-list-item";

        row.textContent =
            p.name +
            " — " +
            p.quantity +
            " units left. Reorder recommended.";

        lowList.appendChild(row);

    });


    if (!low.length) {

        lowList.textContent = "No low-stock products.";

    }


    // Expiry products.

    const body =
        document.getElementById("expiryBody");

    body.textContent = "";


    document.getElementById("expiryEmpty").hidden =
        expiring.length > 0;


    expiring.forEach(p => {

        const days =
            daysUntil(p.expiryDate);

        const row =
            document.createElement("tr");


        addTextCell(row, p.name);

        addTextCell(row, p.batchId);

        addTextCell(row, p.quantity);

        addTextCell(row, days + " days");


        const cell =
            document.createElement("td");

        const tag =
            document.createElement("span");


        tag.className =
            "stock-tag " +
            (
                days <= 2
                    ? "critical"
                    : days <= 7
                        ? "low"
                        : ""
            );


        tag.textContent =

            days < 0
                ? "Expired — remove"

                : days <= 2
                    ? "Critical — clear first"

                    : days <= 7
                        ? "Warning — review"

                        : "Watchlist — FEFO";


        cell.appendChild(tag);

        row.appendChild(cell);

        body.appendChild(row);

    });

}


// =====================================
// 12. INVENTORY ANALYTICS
// =====================================

if (document.getElementById("categoryChart")) {

    const products = getProducts();

    const invoices = readList(INVOICE_KEY);

    const categories = {};


    // Calculate units sold in each category.

    invoices.forEach(invoice => {

        (invoice.items || []).forEach(item => {

            const currentProduct =
                products.find(
                    p => p.id === item.productId
                );


            const category =
                item.category ||
                (
                    currentProduct
                        ? currentProduct.category
                        : "Uncategorised"
                );


            categories[category] =
                (categories[category] || 0) +
                Number(item.quantity);

        });

    });


    const entries =
        Object.entries(categories)
            .sort((a, b) => b[1] - a[1]);


    const max =
        Math.max(
            1,
            ...entries.map(x => x[1])
        );


    const chart =
        document.getElementById("categoryChart");

    chart.textContent = "";


    entries.forEach(([name, value]) => {

        const item =
            document.createElement("div");

        item.className = "bar-item";


        const label =
            document.createElement("div");

        label.className = "bar-label";

        label.textContent = name;


        const track =
            document.createElement("div");

        track.className = "bar-track";


        const fill =
            document.createElement("div");

        fill.className = "bar-fill";

        fill.style.width =
            (value / max * 100) + "%";


        track.appendChild(fill);


        const amount =
            document.createElement("strong");

        amount.textContent =
            value + " units";


        item.append(label, track, amount);

        chart.appendChild(item);

    });


    document.getElementById("analyticsEmpty").hidden =
        entries.length > 0;


    // Calculate the value of current inventory.

    document.getElementById("stockValue").textContent =
        formatPrice(
            products.reduce(
                (sum, p) =>
                    sum +
                    Number(p.quantity) * Number(p.price),
                0
            )
        );


    // Calculate total sales.

    document.getElementById("salesValue").textContent =
        formatPrice(
            invoices.reduce(
                (sum, i) =>
                    sum + Number(i.total),
                0
            )
        );


    document.getElementById("salesCount").textContent =
        invoices.length +
        " completed invoice(s). Category demand is calculated from units sold in completed bills.";

}


// =====================================
// 13. PHYSICAL STOCK COUNT
// =====================================

const countForm =
    document.getElementById("countForm");


if (countForm) {

    const select =
        document.getElementById("countProduct");

    const list =
        document.getElementById("countHistory");


    function loadCountProducts() {

        select.innerHTML =
            '<option value="">Choose a product</option>';


        getProducts().forEach(p => {

            const option =
                document.createElement("option");

            option.value = p.id;

            option.textContent =
                p.name +
                " (system: " +
                p.quantity +
                ")";

            select.appendChild(option);

        });

    }


    function renderCountHistory() {

        list.textContent = "";


        readList(COUNT_KEY)

            .slice()
            .reverse()
            .slice(0, 12)

            .forEach(c => {

                const row =
                    document.createElement("div");

                row.className = "simple-list-item";

                row.textContent =
                    c.productName +
                    " — system: " +
                    c.oldQuantity +
                    ", counted: " +
                    c.newQuantity +
                    " (" +
                    new Date(c.date).toLocaleString() +
                    ")";


                list.appendChild(row);

            });


        if (!list.children.length) {

            list.textContent =
                "No stock counts recorded yet.";

        }

    }


    countForm.addEventListener("submit", e => {

        e.preventDefault();


        const id = select.value;

        const actual =
            Number(
                document.getElementById("countQuantity").value
            );


        let products = getProducts();


        const product =
            products.find(p => p.id === id);


        if (
            !product ||
            !Number.isInteger(actual) ||
            actual < 0
        ) {

            showMessage(
                document.getElementById("countMessage"),
                "Choose a product and enter a whole number of units.",
                true
            );

            return;

        }


        const old = Number(product.quantity);


        products = products.map(p =>

            p.id === id

                ? Object.assign({}, p, {
                    quantity: actual
                })

                : p

        );


        if (!saveProducts(products)) {

            showMessage(
                document.getElementById("countMessage"),
                "Could not save the count.",
                true
            );

            return;

        }


        const history = readList(COUNT_KEY);


        history.push({

            productName: product.name,

            oldQuantity: old,

            newQuantity: actual,

            date: new Date().toISOString()

        });


        writeList(COUNT_KEY, history);


        countForm.reset();

        loadCountProducts();

        renderCountHistory();

        updateDashboard();


        showMessage(
            document.getElementById("countMessage"),
            "Count saved. Stock quantity updated.",
            false
        );

    });


    loadCountProducts();

    renderCountHistory();

}


// =====================================
// 14. INITIAL DASHBOARD UPDATE
// =====================================

updateDashboard();
