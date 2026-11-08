const componentes = {
    header: "components/header.html",
    navbar: "components/navbar.html",
    footer: "components/footer.html"
};

let busquedaActual = "";
let categoriaSeleccionada = "todos";
let grhtCart = cargarDatos("grhtCart");
let grhtComments = cargarDatos("grhtComments");

function cargarDatos(clave) {
    try {
        const datos = JSON.parse(localStorage.getItem(clave));
        return Array.isArray(datos) ? datos : [];
    } catch {
        return [];
    }
}

function guardarDatos(clave, datos) {
    try {
        localStorage.setItem(clave, JSON.stringify(datos));
    } catch {
        alert("No se pudieron guardar los datos.");
    }
}

async function cargarComponentes() {
    for (const [id, archivo] of Object.entries(componentes)) {
        const elemento = document.getElementById(id);

        if (!elemento) {
            console.error(`Falta el contenedor #${id} en esta página.`);
            continue;
        }

        try {
            const respuesta = await fetch(archivo);

            if (!respuesta.ok) {
                throw new Error(`Error ${respuesta.status}: ${archivo}`);
            }

            elemento.innerHTML = await respuesta.text();
            console.log(`${archivo} cargado correctamente.`);
        } catch (error) {
            console.error(`No se pudo cargar ${archivo}:`, error);
        }
    }

    const parametros = new URLSearchParams(window.location.search);
    busquedaActual = parametros.get("buscar") || "";

    const campo = document.getElementById("busqueda");

    if (campo) {
        campo.value = busquedaActual;
    }

    actualizarCatalogo();
}

function buscarProducto() {
    const campo = document.getElementById("busqueda");
    const busqueda = campo ? .value.trim() || "";

    if (!window.location.pathname.endsWith("products.html")) {
        window.location.href = "products.html?buscar=" + encodeURIComponent(busqueda);
        return;
    }

    busquedaActual = busqueda;
    actualizarCatalogo();
}

function filtrarCategoria(categoria, boton) {
    categoriaSeleccionada = categoria;

    document.querySelectorAll("[data-category-filter]").forEach(elemento => {
        elemento.classList.toggle("active", elemento === boton);
    });

    actualizarCatalogo();
}

function actualizarCatalogo() {
    const secciones = document.querySelectorAll(".grht-categories");
    let encontrados = 0;

    secciones.forEach(seccion => {
        const coincideCategoria =
            categoriaSeleccionada === "todos" ||
            seccion.dataset.category === categoriaSeleccionada;

        let visibles = 0;

        seccion.querySelectorAll(".grht-product").forEach(producto => {
            const coincideBusqueda = producto.textContent
                .toLowerCase()
                .includes(busquedaActual.toLowerCase());

            const mostrar = coincideCategoria && coincideBusqueda;
            producto.hidden = !mostrar;

            if (mostrar) {
                visibles++;
                encontrados++;
            }
        });

        seccion.hidden = visibles === 0;
    });

    const mensaje = document.getElementById("grht-no-results");

    if (mensaje) {
        mensaje.hidden = encontrados > 0;
    }
}

function guardarCarrito() {
    guardarDatos("grhtCart", grhtCart);
}

function obtenerPrecio(tarjeta) {
    const precioPrincipal = tarjeta.querySelector("h5");

    if (precioPrincipal) {
        return Number(precioPrincipal.textContent.replace(/[^\d.]/g, ""));
    }

    const precio = [...tarjeta.querySelectorAll("p")].find(elemento =>
        /S\/\s*[\d,.]+/.test(elemento.textContent) &&
        !elemento.querySelector("del") &&
        !elemento.closest("del")
    );

    return precio ?
        Number(precio.textContent.replace(/[^\d.]/g, "")) :
        NaN;
}

function agregarAlCarrito(boton) {
    const tarjeta = boton.closest(".grht-card");

    if (!tarjeta) return;

    const nombre = tarjeta.querySelector("h3") ? .textContent.trim();
    const imagen = tarjeta.querySelector("img") ? .src;
    const precio = obtenerPrecio(tarjeta);

    if (!nombre || !imagen || !Number.isFinite(precio) || precio <= 0) {
        alert("No se pudo identificar correctamente el producto.");
        return;
    }

    const id = nombre.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const existente = grhtCart.find(producto => producto.id === id);

    if (existente) {
        existente.cantidad++;
    } else {
        grhtCart.push({ id, nombre, imagen, precio, cantidad: 1 });
    }

    guardarCarrito();
    window.location.href = "shopping.html";
}

function crearBoton(texto, accion, indice, clase) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = clase;
    boton.textContent = texto;
    boton.dataset.cartAction = accion;
    boton.dataset.index = indice;
    return boton;
}

function mostrarCarrito() {
    const contenedor = document.getElementById("grht-cart-products");
    const totalElemento = document.getElementById("grht-cart-total");
    const mensajeVacio = document.getElementById("grht-cart-empty");

    if (!contenedor || !totalElemento || !mensajeVacio) return;

    contenedor.replaceChildren();

    let total = 0;
    mensajeVacio.hidden = grhtCart.length > 0;

    grhtCart.forEach((producto, indice) => {
        const subtotal = producto.precio * producto.cantidad;
        total += subtotal;

        const tarjeta = document.createElement("div");
        tarjeta.className = "grht-cart-item card p-3 mb-3";

        const fila = document.createElement("div");
        fila.className = "row align-items-center";

        const columnaImagen = document.createElement("div");
        columnaImagen.className = "col-4 col-md-2";

        const imagen = document.createElement("img");
        imagen.src = producto.imagen;
        imagen.alt = producto.nombre;
        imagen.className = "img-fluid";
        columnaImagen.appendChild(imagen);

        const columnaDatos = document.createElement("div");
        columnaDatos.className = "col";

        const nombre = document.createElement("h3");
        nombre.className = "grht-cart-product-title";
        nombre.textContent = producto.nombre;

        const precio = document.createElement("p");
        precio.className = "grht-cart-product-price";
        precio.textContent = `Precio: S/ ${producto.precio.toFixed(2)}`;

        const controles = document.createElement("div");
        controles.className = "grht-cart-controls";

        const disminuir = crearBoton("−", "decrease", indice, "grht-cart-quantity");

        const cantidad = document.createElement("span");
        cantidad.className = "grht-cart-quantity-value";
        cantidad.textContent = producto.cantidad;

        const aumentar = crearBoton("+", "increase", indice, "grht-cart-quantity");
        controles.append(disminuir, cantidad, aumentar);

        const subtotalElemento = document.createElement("strong");
        subtotalElemento.className = "grht-cart-subtotal";
        subtotalElemento.textContent = `Subtotal: S/ ${subtotal.toFixed(2)}`;

        const eliminar = crearBoton("Eliminar", "remove", indice, "grht-cart-remove");

        const icono = document.createElement("i");
        icono.className = "bi bi-trash";
        eliminar.prepend(icono, " ");

        columnaDatos.append(nombre, precio, controles, subtotalElemento, eliminar);
        fila.append(columnaImagen, columnaDatos);
        tarjeta.appendChild(fila);
        contenedor.appendChild(tarjeta);
    });

    totalElemento.textContent = `S/ ${total.toFixed(2)}`;
}

function cambiarCantidad(indice, cambio) {
    const producto = grhtCart[indice];
    if (!producto) return;

    producto.cantidad += cambio;

    if (producto.cantidad <= 0) {
        grhtCart.splice(indice, 1);
    }

    guardarCarrito();
    mostrarCarrito();
}

function eliminarProducto(indice) {
    if (!grhtCart[indice]) return;

    grhtCart.splice(indice, 1);
    guardarCarrito();
    mostrarCarrito();
}

function vaciarCarrito() {
    if (!grhtCart.length) return;

    if (confirm("¿Deseas vaciar el carrito?")) {
        grhtCart = [];
        guardarCarrito();
        mostrarCarrito();
    }
}

function finalizarCompra() {
    alert(grhtCart.length ?
        "La función de pago todavía no está implementada." :
        "Tu carrito está vacío.");
}

function guardarComentarios() {
    guardarDatos("grhtComments", grhtComments);
}

function mostrarComentarios() {
    const contenedor = document.getElementById("grht-comments-list");
    const mensaje = document.getElementById("grht-comments-empty");

    if (!contenedor || !mensaje) return;

    contenedor.replaceChildren();
    mensaje.hidden = grhtComments.length > 0;

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
        boton.dataset.commentIndex = indice;

        const iconoEliminar = document.createElement("i");
        iconoEliminar.className = "bi bi-trash";
        boton.append(iconoEliminar, " Eliminar");

        tarjeta.append(encabezado, fecha, texto, boton);
        columna.appendChild(tarjeta);
        contenedor.appendChild(columna);
    });
}

function agregarComentario(formulario) {
    const nombre = document.getElementById("grht-comment-name") ? .value.trim();
    const texto = document.getElementById("grht-comment-text") ? .value.trim();

    if (!nombre || !texto) return;

    grhtComments.unshift({
        nombre,
        texto,
        fecha: new Date().toLocaleString("es-PE")
    });

    guardarComentarios();
    mostrarComentarios();
    formulario.reset();
}

function eliminarComentario(indice) {
    if (!grhtComments[indice]) return;
    if (!confirm("¿Deseas eliminar este comentario?")) return;

    grhtComments.splice(indice, 1);
    guardarComentarios();
    mostrarComentarios();
}

function procesarReclamacion(evento) {
    evento.preventDefault();

    alert(
        "Este formulario es una demostración. " +
        "La reclamación no se ha enviado ni registrado. " +
        "Para recibir solicitudes reales, TecnoNova necesita un servidor conectado."
    );
}

document.addEventListener("submit", evento => {
    const formulario = evento.target;

    if (formulario.id === "grht-search-form") {
        evento.preventDefault();
        buscarProducto();
    }

    if (formulario.id === "grht-comments-form") {
        evento.preventDefault();
        agregarComentario(formulario);
    }

    if (formulario.id === "grht-complaints-form") {
        procesarReclamacion(evento);
    }
});

document.addEventListener("click", evento => {
    const objetivo = evento.target;
    if (!(objetivo instanceof Element)) return;

    const filtro = objetivo.closest("[data-category-filter]");

    if (filtro) {
        filtrarCategoria(filtro.dataset.categoryFilter, filtro);
        return;
    }

    const botonCompra = objetivo.closest(".grht-card .btn-solid");

    if (botonCompra) {
        evento.preventDefault();
        agregarAlCarrito(botonCompra);
        return;
    }

    const accionCarrito = objetivo.closest("[data-cart-action]");

    if (accionCarrito) {
        const indice = Number(accionCarrito.dataset.index);

        switch (accionCarrito.dataset.cartAction) {
            case "increase":
                cambiarCantidad(indice, 1);
                break;
            case "decrease":
                cambiarCantidad(indice, -1);
                break;
            case "remove":
                eliminarProducto(indice);
                break;
            case "clear":
                vaciarCarrito();
                break;
            case "checkout":
                finalizarCompra();
                break;
        }

        return;
    }

    const botonComentario = objetivo.closest("[data-comment-index]");

    if (botonComentario) {
        eliminarComentario(Number(botonComentario.dataset.commentIndex));
    }
});

document.addEventListener("DOMContentLoaded", () => {
    cargarComponentes();
    mostrarCarrito();
    mostrarComentarios();
});