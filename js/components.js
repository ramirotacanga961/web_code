const componentes = {
    header: "components/header.html",
    navbar: "components/navbar.html",
    footer: "components/footer.html"
};

let busquedaActual = "";
let categoriaSeleccionada = "todos";
let grhtCart = JSON.parse(localStorage.getItem("grhtCart")) || [];

async function cargarComponentes() {
    for (const [id, archivo] of Object.entries(componentes)) {
        const elemento = document.getElementById(id);

        if (elemento) {
            try {
                const respuesta = await fetch(archivo);
                if (!respuesta.ok) throw new Error(`No se pudo cargar ${archivo}`);
                elemento.innerHTML = await respuesta.text();
            } catch (error) {
                console.error(error);
            }
        }
    }

    const parametros = new URLSearchParams(window.location.search);
    const busqueda = parametros.get("buscar");

    if (busqueda !== null) {
        busquedaActual = busqueda;
        const campo = document.getElementById("busqueda");
        if (campo) campo.value = busqueda;
    }

    actualizarCatalogo();
}

function buscarProducto() {
    const busqueda = document.getElementById("busqueda")?.value.trim() || "";

    if (!window.location.pathname.endsWith("products.html")) {
        window.location.href = "products.html?buscar=" + encodeURIComponent(busqueda);
        return;
    }

    busquedaActual = busqueda;
    actualizarCatalogo();
}

function filtrarCategoria(categoria, boton) {
    categoriaSeleccionada = categoria;

    document.querySelectorAll(".btn-outline-primary").forEach(btn => {
        btn.classList.remove("active");
    });

    boton.classList.add("active");
    actualizarCatalogo();
}

function actualizarCatalogo() {
    const secciones = document.querySelectorAll(".grht-categories");
    let encontrados = 0;

    secciones.forEach(seccion => {
        const coincide = categoriaSeleccionada === "todos" ||
            seccion.dataset.category === categoriaSeleccionada;

        let visibles = 0;

        seccion.querySelectorAll(".grht-product").forEach(producto => {
            const mostrar = coincide &&
                producto.textContent.toLowerCase().includes(busquedaActual.toLowerCase());

            producto.style.display = mostrar ? "" : "none";

            if (mostrar) {
                visibles++;
                encontrados++;
            }
        });

        seccion.style.display = visibles ? "" : "none";
    });

    const mensaje = document.getElementById("grht-no-results");

    if (mensaje) {
        mensaje.style.display = encontrados ? "none" : "block";
    }
}

function grhtSaveCart() {
    localStorage.setItem("grhtCart", JSON.stringify(grhtCart));
}

document.addEventListener("click", e => {
    const boton = e.target.closest(".grht-card .btn-solid");
    if (!boton) return;

    const tarjeta = boton.closest(".grht-card");
    if (!tarjeta) return;

    if (boton.tagName === "A" && !boton.getAttribute("href")?.includes("shopping.html")) return;
    if (boton.tagName !== "A" && boton.tagName !== "BUTTON") return;

    e.preventDefault();

    const nombre = tarjeta.querySelector("h3")?.textContent.trim();
    const imagen = tarjeta.querySelector("img")?.src;
    const precioElemento = tarjeta.querySelector("h5") ||
        tarjeta.querySelector("div.d-flex.flex-column > div > p:nth-of-type(2)");

    if (!nombre || !imagen || !precioElemento) return;

    const precio = Number(precioElemento.textContent.replace(/[^\d.]/g, ""));
    if (!Number.isFinite(precio)) return;

    const id = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const producto = grhtCart.find(p => p.id === id);

    if (producto) {
        producto.cantidad++;
    } else {
        grhtCart.push({ id, nombre, imagen, precio, cantidad: 1 });
    }

    grhtSaveCart();
    window.location.href = "shopping.html";
});

function grhtShowCart() {
    const contenedor = document.getElementById("grht-cart-products");
    const totalElemento = document.getElementById("grht-cart-total");
    const mensajeVacio = document.getElementById("grht-cart-empty");

    if (!contenedor || !totalElemento || !mensajeVacio) return;

    contenedor.innerHTML = "";
    let total = 0;

    mensajeVacio.style.display = grhtCart.length ? "none" : "block";

    grhtCart.forEach((producto, indice) => {
        const subtotal = producto.precio * producto.cantidad;
        total += subtotal;

        contenedor.innerHTML += `
            <div class="grht-cart-item card p-3 mb-3">
                <div class="row align-items-center">
                    <div class="col-4 col-md-2">
                        <img src="${producto.imagen}" class="img-fluid"
                            alt="${producto.nombre}">
                    </div>

                    <div class="col">
                        <h3 class="grht-cart-product-title">${producto.nombre}</h3>
                        <p class="grht-cart-product-price">
                            Precio: S/ ${producto.precio.toFixed(2)}
                        </p>

                        <div class="grht-cart-controls">
                            <button type="button" class="grht-cart-quantity"
                                onclick="grhtChangeQuantity(${indice}, -1)">−</button>

                            <span class="grht-cart-quantity-value">${producto.cantidad}</span>

                            <button type="button" class="grht-cart-quantity"
                                onclick="grhtChangeQuantity(${indice}, 1)">+</button>
                        </div>

                        <strong class="grht-cart-subtotal">
                            Subtotal: S/ ${subtotal.toFixed(2)}
                        </strong>

                        <button type="button" class="grht-cart-remove"
                            onclick="grhtRemoveProduct(${indice})">
                            <i class="bi bi-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            </div>`;
    });

    totalElemento.textContent = `S/ ${total.toFixed(2)}`;
}

function grhtChangeQuantity(indice, cambio) {
    grhtCart[indice].cantidad += cambio;

    if (grhtCart[indice].cantidad <= 0) {
        grhtCart.splice(indice, 1);
    }

    grhtSaveCart();
    grhtShowCart();
}

function grhtRemoveProduct(indice) {
    grhtCart.splice(indice, 1);
    grhtSaveCart();
    grhtShowCart();
}

function grhtClearCart() {
    if (grhtCart.length && confirm("¿Deseas vaciar el carrito?")) {
        grhtCart = [];
        grhtSaveCart();
        grhtShowCart();
    }
}

function grhtCheckout() {
    alert(grhtCart.length
        ? "La función de pago se implementará posteriormente."
        : "Tu carrito está vacío.");
}

cargarComponentes();
grhtShowCart();

let grhtComments = JSON.parse(localStorage.getItem("grhtComments")) || [];

function grhtSaveComments() {
    localStorage.setItem("grhtComments", JSON.stringify(grhtComments));
}

function grhtShowComments() {
    const contenedor = document.getElementById("grht-comments-list");
    const mensaje = document.getElementById("grht-comments-empty");

    if (!contenedor || !mensaje) return;

    contenedor.innerHTML = "";
    mensaje.style.display = grhtComments.length ? "none" : "block";

    grhtComments.forEach((comentario, indice) => {
        const columna = document.createElement("div");
        columna.className = "col-12 col-md-6 col-lg-4";

        const tarjeta = document.createElement("div");
        tarjeta.className = "card h-100 p-3";

        const encabezado = document.createElement("div");
        encabezado.className = "d-flex justify-content-between align-items-center mb-2";

        const nombre = document.createElement("h5");
        nombre.className = "mb-0";
        nombre.textContent = comentario.nombre;

        const icono = document.createElement("i");
        icono.className = "bi bi-chat-left-quote fs-4";

        encabezado.append(nombre, icono);

        const fecha = document.createElement("small");
        fecha.className = "text-muted mb-3";
        fecha.textContent = comentario.fecha;

        const texto = document.createElement("p");
        texto.className = "mb-3";
        texto.textContent = comentario.texto;

        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "btn btn-outline-danger btn-sm align-self-start";
        boton.innerHTML = '<i class="bi bi-trash"></i> Eliminar';
        boton.dataset.index = indice;

        tarjeta.append(encabezado, fecha, texto, boton);
        columna.appendChild(tarjeta);
        contenedor.appendChild(columna);
    });
}

function grhtAddComment(event) {
    event.preventDefault();

    const nombre = document.getElementById("grht-comment-name").value.trim();
    const texto = document.getElementById("grht-comment-text").value.trim();

    if (!nombre || !texto) return;

    grhtComments.unshift({
        nombre,
        texto,
        fecha: new Date().toLocaleString("es-PE")
    });

    grhtSaveComments();
    grhtShowComments();

    document.getElementById("grht-comments-form").reset();
}

function grhtDeleteComment(indice) {
    if (!confirm("¿Deseas eliminar este comentario?")) return;

    grhtComments.splice(indice, 1);
    grhtSaveComments();
    grhtShowComments();
}

document.addEventListener("submit", event => {
    if (event.target.id === "grht-comments-form") {
        grhtAddComment(event);
    }
});

document.addEventListener("click", event => {
    const boton = event.target.closest("#grht-comments-list button[data-index]");

    if (boton) {
        grhtDeleteComment(Number(boton.dataset.index));
    }
});

grhtShowComments();