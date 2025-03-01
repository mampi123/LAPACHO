const tokenJWT = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbGFwYWNoby0xLmxvY2FsIiwiaWF0IjoxNzQwNjYxMzk2LCJuYmYiOjE3NDA2NjEzOTYsImV4cCI6MTc0MTI2NjE5NiwiZGF0YSI6eyJ1c2VyIjp7ImlkIjoiMSJ9fX0.VwmAHnRStGuxky_aTYyj6xN_RPmMoAP_JZlqQ8vF27o";

// 🔹 Cargar productos desde la API de WooCommerce
async function getProducts() {
    try {
        const response = await fetch("http://lapacho-1.local/wp-json/wc/v3/products", {
            method: "GET",
            mode: "cors",
            headers: {
                "Authorization": `Bearer ${tokenJWT}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }

        const products = await response.json();
        if (products.length === 0) {
            document.getElementById("products-container").innerHTML = `<p>No hay productos disponibles.</p>`;
            return;
        }

        let productsHTML = products.map(product => `
            <div class="product">
                <img src="${product.images.length ? product.images[0].src : 'https://via.placeholder.com/150'}" alt="${product.name}">
                <h2>${product.name}</h2>
                <p>Precio: $${product.price}</p>
                <a href="${product.permalink}" target="_blank">
                    <button>Ver Producto</button>
                </a>
                <button onclick="addToCart(${product.id}, 1)">🛒 Añadir al carrito</button>
            </div>
        `).join("");

        document.getElementById("products-container").innerHTML = productsHTML;
    } catch (error) {
        console.error("❌ Error al obtener los productos:", error);
        document.getElementById("products-container").innerHTML = `<p>Error al cargar los productos. Revisa la consola.</p>`;
    }
}



async function obtenerNonceDesdeServidor() {
    try {
        const response = await fetch("http://lapacho-1.local/wp-admin/admin-ajax.php?action=obtener_nonce", {
            method: "GET",
            mode: "cors",
            headers: {
                "Authorization": `Bearer ${tokenJWT}`,
            }
        });
        const data = await response.json();
        
        if (data.success && data.data.nonce) {
            console.log("✅ Nonce obtenido desde el servidor:", data.data.nonce);
            return data.data.nonce;
        } else {
            console.error("❌ No se pudo obtener el nonce.");
            return null;
        }
    } catch (error) {
        console.error("❌ Error al obtener el nonce:", error);
        return null;
    }
}


// 🔹 Añadir producto al carrito en WooCommerce
async function addToCart(productId, quantity) {
    const cartUrl = "http://lapacho-1.local/?wc-ajax=add_to_cart";

    try {
        console.log(`🛒 Intentando añadir producto ID: ${productId} con cantidad: ${quantity}`);

        const response = await fetch(cartUrl, {
            method: "POST",
            mode: "cors",
            credentials: "include",  // 🔥 Esto es clave para enviar cookies
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": "Bearer TU_TOKEN_JWT", // 🔥 Asegúrate de incluir esto
                "User-Agent": "Mozilla/5.0"
            },
            body: new URLSearchParams({
                product_id: productId,
                quantity: quantity
            })
        });

        const data = await response.json();
        console.log("✅ Respuesta del servidor:", data);

        if (data.fragments) {
            document.querySelector('.widget_shopping_cart_content').innerHTML = data.fragments['div.widget_shopping_cart_content'];
            alert("✅ Producto añadido al carrito!");
        } else {
            alert("⚠️ Error al añadir al carrito");
        }
    } catch (error) {
        console.error("❌ Error al añadir al carrito:", error);
    }
}




// 🔹 Actualizar la interfaz del carrito
async function updateCartUI() {
    try {
        const response = await fetch(`http://lapacho-1.local/wp-json/wc/store/cart?timestamp=${new Date().getTime()}`, {
            method: "GET",
            mode: "cors",
            headers: {
                "Authorization": `Bearer ${tokenJWT}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }

        const cartData = await response.json();
        console.log("🛒 Estado del carrito:", cartData);

        if (cartData.items && cartData.items.length > 0) {
            document.getElementById("cart-container").innerHTML = cartData.items
                .map(item => `<p>${item.name} x ${item.quantity} - $${item.line_total}</p>`)
                .join("");
        } else {
            document.getElementById("cart-container").innerHTML = "<p>El carrito está vacío</p>";
        }
    } catch (error) {
        console.error("❌ Error al obtener el carrito:", error);
    }
}

// 🔹 Ejecutar funciones al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    getProducts();
    updateCartUI();
});
