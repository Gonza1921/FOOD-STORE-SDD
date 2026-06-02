## MODIFIED Requirements

### Requirement: Categoria model and API

#### Modified: Slug field for friendly URLs

**FROM**: Categoria model has `id`, `nombre`, `descripcion`, `parent_id`, audit fields
**TO**: Categoria model SHALL include a `slug` field with unique constraint for URL-friendly identifiers

### Requirement: Create category with slug

- MUST agregar campo `slug: str` al modelo Categoria con unique constraint
- MUST generar slug automáticamente desde `nombre` usando slugify
- MUST permitir especificar slug explícitamente en creación (opcional)
- MUST validar slug único globalmente

---

## ADDED Requirements

### Requirement: Public category listing endpoint

The system SHALL provide a public endpoint to list all non-deleted categories without authentication.

#### Scenario: List categories publicly
- **WHEN** a GET request is made to `GET /api/v1/categorias/publicas`
- **THEN** the response SHALL return a list of categories with `id`, `nombre`, `slug`, `descripcion`, `parent_id`, `producto_count`
- **AND** the endpoint SHALL NOT require authentication

#### Scenario: Public listing excludes deleted categories
- **WHEN** a GET request is made to `GET /api/v1/categorias/publicas`
- **THEN** categories with `deleted_at` set SHALL be excluded from results

---

### Requirement: Public category detail endpoint

The system SHALL provide a public endpoint to get a category with its subcategories and products.

#### Scenario: Get category by slug
- **WHEN** a GET request is made to `GET /api/v1/categorias/publicas/{slug}`
- **THEN** the response SHALL return the category with `id`, `nombre`, `slug`, `descripcion`, `parent_id`, `subcategorias`, and `productos`
- **AND** the endpoint SHALL NOT require authentication

#### Scenario: Category not found returns 404
- **WHEN** a GET request is made to `GET /api/v1/categorias/publicas/invalid-slug`
- **THEN** the response SHALL return 404

---

### Requirement: Categories page lists all categories

The `/categorias` page SHALL display all available product categories as visual cards.

#### Scenario: Categories page shows category cards
- **WHEN** a user navigates to `/categorias`
- **THEN** the page SHALL display a grid of category cards
- **AND** each card SHALL show the category name and product count

#### Scenario: Clicking a category navigates to category detail
- **WHEN** a user clicks a category card
- **THEN** the browser SHALL navigate to `/categorias/<slug>` for that category

---

### Requirement: Category detail page shows products

The `/categorias/:slug` page SHALL display products belonging to that category with subcategory filtering and sorting.

#### Scenario: Category detail shows products
- **WHEN** a user navigates to `/categorias/<slug>`
- **THEN** the page SHALL display a breadcrumb showing the category path
- **AND** a sidebar with subcategories as filter checkboxes
- **AND** a grid of products in that category
- **AND** sort options (price low-high, price high-low, name A-Z, newest first)

#### Scenario: Filter by subcategory
- **WHEN** a user checks a subcategory checkbox in the sidebar
- **THEN** the product list SHALL filter to show only products in that subcategory

#### Scenario: Sort products by price
- **WHEN** a user selects "Precio: menor a mayor" in the sort dropdown
- **THEN** the products SHALL be reordered by price ascending

#### Scenario: Category detail is responsive
- **WHEN** a user views the category detail on mobile (<768px)
- **THEN** the subcategory sidebar SHALL collapse into a dropdown/accordion
- **AND** the product grid SHALL display in single column

---

### Requirement: Breadcrumb shows category hierarchy

The breadcrumb SHALL show the navigation path from Home to the current category.

#### Scenario: Breadcrumb for subcategory
- **WHEN** a user is viewing a subcategory like "Gaseosas" under "Bebidas"
- **THEN** the breadcrumb SHALL display: `Inicio > Bebidas > Gaseosas`

#### Scenario: Breadcrumb links are clickable
- **WHEN** a user clicks a breadcrumb link
- **THEN** the browser SHALL navigate to that category or home page
