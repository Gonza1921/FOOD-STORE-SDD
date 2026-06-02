# Customer Navbar & Footer Specifications

## Requirements

### Requirement: Navbar displays logo, search, categories, cart, and profile

The Navbar SHALL display five main sections in a horizontal layout on desktop: Logo, Search Bar, Categories Dropdown, Cart Button with badge, and Profile section with user info.

#### Scenario: Navbar renders all sections on desktop
- **WHEN** a CLIENT user views the page on a desktop screen (≥768px)
- **THEN** the Navbar SHALL display Logo, Search, Categories, Cart, and Profile inline
- **AND** the layout SHALL be horizontal with items aligned

#### Scenario: Navbar collapses to hamburger on mobile
- **WHEN** a CLIENT user views the page on a mobile screen (<768px)
- **THEN** the Navbar SHALL display only Logo and hamburger menu button
- **AND** clicking the hamburger SHALL open a vertical drawer with all navigation items

#### Scenario: Mobile menu closes on link click
- **WHEN** a user clicks a navigation link in the mobile menu
- **THEN** the mobile menu SHALL close automatically

---

### Requirement: Logo links to homepage

The Navbar SHALL display a clickable logo/brand that navigates to the root path.

#### Scenario: Logo click navigates to home
- **WHEN** a user clicks the logo in the Navbar
- **THEN** the browser SHALL navigate to `/`

---

### Requirement: Search bar provides product suggestions

The Navbar SHALL include a search input that fetches product suggestions as the user types, with debounce.

#### Scenario: Search shows suggestions while typing
- **WHEN** a user types in the search input
- **THEN** after 300ms of no typing, a request SHALL be made to the product catalog with the search term
- **AND** a dropdown SHALL show up to 8 matching product suggestions

#### Scenario: Search dropdown closes on blur
- **WHEN** the search input loses focus
- **THEN** the suggestions dropdown SHALL close

#### Scenario: Enter key navigates to catalog search
- **WHEN** a user presses Enter while the search input is focused
- **THEN** the browser SHALL navigate to `/catalogo?search=<query>`

#### Scenario: Click on suggestion navigates to product detail
- **WHEN** a user clicks a product suggestion in the search dropdown
- **THEN** the browser SHALL navigate to `/productos/<id>` for that product

---

### Requirement: Categories dropdown lists product categories

The Navbar SHALL include a categories dropdown that fetches available categories from the API.

#### Scenario: Categories dropdown fetches and displays categories
- **WHEN** a user clicks the Categories trigger in the Navbar
- **THEN** a request SHALL be made to `GET /categorias`
- **AND** the response SHALL be displayed as a dropdown list of category names

#### Scenario: Clicking a category navigates to filtered catalog
- **WHEN** a user clicks a category in the dropdown
- **THEN** the browser SHALL navigate to `/catalogo?categoria_id=<id>`

---

### Requirement: Cart button shows item count badge

The Navbar SHALL include a cart button that displays the current number of items in the cart.

#### Scenario: Cart badge shows correct count
- **WHEN** the cart has items in the Zustand store
- **THEN** the cart button SHALL display a badge with the total item count
- **AND** clicking the cart button SHALL navigate to `/carrito`

#### Scenario: Cart badge hides when empty
- **WHEN** the cart is empty
- **THEN** the cart button SHALL NOT display a badge

---

### Requirement: Profile section shows user info and navigation

The Navbar SHALL include a profile section showing the logged-in user's name with a dropdown menu.

#### Scenario: Profile shows user name
- **WHEN** a user is logged in
- **THEN** the profile section SHALL display the user's first name initial in an avatar circle
- **AND** the user's name SHALL be displayed next to the avatar

#### Scenario: Profile dropdown shows navigation links
- **WHEN** a user clicks the profile section
- **THEN** a dropdown menu SHALL open with links to:
  - "Mi Perfil" → `/mi-perfil`
  - "Mis Pedidos" → `/mis-pedidos`
  - "Mis Direcciones" → `/mis-direcciones`

#### Scenario: Logout button works from profile dropdown
- **WHEN** a user clicks "Cerrar Sesión" in the profile dropdown
- **THEN** the auth store SHALL be cleared
- **AND** the browser SHALL navigate to `/login`

---

### Requirement: Footer displays company info and links

The Footer SHALL display company information, quick links, and copyright notice.

#### Scenario: Footer renders with all sections
- **WHEN** Footer renders on any customer page
- **THEN** it SHALL display company name, brief description, and quick links
- **AND** it SHALL display a copyright notice with the current year

---

### Requirement: CustomerLayout integrates Navbar and Footer

CustomerLayout SHALL render the Navbar at the top and Footer at the bottom of every customer page.

#### Scenario: Navbar and Footer render on all customer pages
- **WHEN** a CLIENT user navigates to any customer route (`/carrito`, `/checkout`, `/mi-perfil`, etc.)
- **THEN** the Navbar SHALL be visible at the top of the page
- **AND** the Footer SHALL be visible at the bottom of the page
- **AND** the page content SHALL render between Navbar and Footer

#### Scenario: Navbar is sticky at top
- **WHEN** a user scrolls down on any customer page
- **THEN** the Navbar SHALL remain fixed at the top of the viewport (sticky)
