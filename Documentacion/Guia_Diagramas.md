# Guía de Arquitectura Visual: E-Commerce DApp

Esta guía contiene los modelos avanzados para documentar tu proyecto como un Arquitecto de Software.

## 1. Diagrama de Base de Datos (ERD - Entity Relationship)
En Blockchain, el "ERD" representa cómo se estructuran los `structs` y `mappings`. Este diagrama es vital para entender la persistencia de datos.

### Código para Eraser (ERD as Code)
```eraser
// Tablas de la Blockchain
Company [icon: building] {
  ruc string [pk]
  name     
  wallet address
  establishmentCode string
  nextInvoiceNumber uint256
}

Product [icon: package] {
  id uint256 [pk]
  name string
  price_1 uint256
  stock uint256
  companyRuc string [fk]
}

Invoice [icon: file-text] {
  invoiceId string [pk]
  companyRuc string [fk]
  customerWallet address
  totalAmount uint256
}

// Relaciones
Company.ruc 1 <> * Product.companyRuc
Company.ruc 1 <> * Invoice.companyRuc
```

---

## 2. Diagrama de Secuencia (El flujo de Pago)
Muestra la interacción temporal entre el Cliente, el Contrato y la Moneda (CBT).

### Código para Eraser (Sequence as Code)
```eraser
// Actores
Comprador [shape: person]
Ecommerce_SC [icon: cpu]
CBToken_SC [icon: dollar]
Vendedor [shape: house]

// Secuencia de Compra
Comprador > Ecommerce_SC: 1. checkout()
Ecommerce_SC > CBToken_SC: 2. transferFrom(Comprador, Vendedor, 90%)
CBToken_SC > Vendedor: 3. Recibe fondos
Ecommerce_SC > CBToken_SC: 4. transferFrom(Comprador, Vault, 10%)
Ecommerce_SC > Comprador: 5. Emite Factura SRI
```

---

## 3. Wireframes (Fase 5: Web Admin)
Esto lo aplicaremos en la siguiente fase. Dibujaremos el esqueleto de:
- Tabla de productos con botón de "Reponer Stock".
- Formulario de "Crear Compañía" (solo para Admin).

---

## 4. Diagrama de Secuencia: Admin Web (Lectura de Eventos)
Este es el mecanismo "Pro" que usamos para listar productos sin gastar gas, leyendo el historial de la Blockchain.

### Código para Eraser (Sequence as Code)
```eraser
// Actores
Admin [shape: person]
WebAdmin_UI [icon: monitor]
Blockchain_Logs [icon: database]
Smart_Contract [icon: cpu]

// Flujo: Carga de Productos
Admin > WebAdmin_UI: 1. Selecciona Empresa (Dropdown)
WebAdmin_UI > Blockchain_Logs: 2. queryFilter(ProductAdded)
Blockchain_Logs > WebAdmin_UI: 3. Retorna Array de Eventos [id, name, ... ]
WebAdmin_UI > Smart_Contract: 4. products(id) [Para validar estado actual]
Smart_Contract > WebAdmin_UI: 5. Retorna { stock, price, active }
WebAdmin_UI > Admin: 6. Muestra Tabla de Inventario
```

---

## 5. Cómo subir esto a GitHub (Tips de Arquitecto)

Tienes dos niveles para hacer esto:

### Nivel Profesional (El Código)
1.  Crea una carpeta llamada `Documentacion/diagramas/`.
2.  Crea archivos con extensión `.txt` o `.eraser` (ej: `flujo-pagos.eraser`).
3.  Pega allí el código que te he dado. 
    - **Por qué:** Si mañana cambias el código de Solidity, vienes a este archivo, cambias el nombre del campo, y vuelves a generar la imagen en 2 segundos.

### Nivel Visual (La Imagen)
GitHub no puede "dibujar" el código de Eraser directamente (aunque sí puede dibujar uno llamado **Mermaid**). 
1.  En Eraser, usa **Export -> Raycast/Image**.
2.  Guarda la imagen en `Documentacion/imagenes/`.
3.  En tu `README.md` o `Evidencias_Informe.md`, inserta la imagen así:
    `![Diagrama de Roles](./imagenes/roles.png)`

> [!TIP]
> **El Secreto del Senior:** Un buen repositorio de GitHub tiene una carpeta `/docs` con archivos de texto que generan los diagramas. Esto se llama **"Living Documentation"** (Documentación Viva).
