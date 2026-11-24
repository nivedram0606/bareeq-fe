# Test IDs for automation

Every element a test needs to find or click carries a `data-testid` attribute. This includes buttons, links, fields, menu items, tabs, table rows and cells, dialogs, headings and messages. Use these attributes in Playwright, Cypress or Selenium instead of visible text or CSS classes. They don't change with the language (English/Arabic) or the design.

```ts
// Playwright
await page.getByTestId('login-username').fill('admin');
// Cypress
cy.get('[data-testid="login-submit"]').click();
// Selenium
driver.findElement(By.css('[data-testid="students-new"]'));
```

## How IDs are built

IDs are `<scope>-<element>`. The scope is the page or dialog:

| Scope | Where |
| --- | --- |
| `login` | Sign-in page |
| `dashboard` | Dashboard |
| `students`, `student`, `student-form` | Students list, student page, new/edit student page |
| `student-guardians`, `student-fees` | Guardians and Fees tabs on the student page |
| `classes`, `staff` | Classes, Staff directory |
| `report-students`, `report-fee-collection`, `report-outstanding` | Reports |
| `settings-org`, `settings-branding`, `users`, `years`, `settings-export` | Settings pages |
| `change-password` | Change password page |
| `sidebar`, `header`, `mobile-menu` | Desktop sidebar, top bar, phone/tablet menu |
| `not-found`, `forbidden`, `crash` | Fallback pages |

Dialogs have their own scope, for example `staff-form`, `class-form`, `user-form`, `reset-password-form`, `year-form`, `guardian-form`, `fee-form`, `payment-form` and `void-payment-form`. Confirmation dialogs have one too: `student-status-dialog`, `guardian-delete-dialog` and `user-status-dialog`.

### Patterns that repeat everywhere

| Element | ID |
| --- | --- |
| Page heading / description | `<scope>-heading`, `<scope>-description` |
| Form field | `<scope>-<fieldName>`: the field name the API uses, e.g. `staff-form-fullName`, `student-form-primaryContact-phone` |
| Field error / hint text | `<field id>-error`, `<field id>-hint` |
| Password show/hide (eye) button | `<field id>-toggle` (e.g. `login-password-toggle`) |
| Dialog | `<dialog>`, with `<dialog>-heading`, `<dialog>-description`, `<dialog>-cancel`, `<dialog>-submit` (or `-confirm`) and `<dialog>-close` (the ×) |
| Search box and its × | `<scope>-search`, `<scope>-search-clear` |
| Filters | `<scope>-filter-<name>` (e.g. `students-filter-class`), `<scope>-clear-filters` |
| "New" button | `<scope>-new` (e.g. `students-new`, `staff-new`) |
| Table | `<scope>-table`, column header `<scope>-col-<column>` |
| Table row | `<scope>-row-<record id>` |
| Table cell | `<scope>-row-<record id>-<column>` |
| Row action | `<scope>-row-<record id>-<action>` (e.g. `staff-row-<id>-edit`) |
| Empty / error / retry | `<scope>-empty`, `<scope>-error`, `<scope>-retry` |
| Loading | `<scope>-loading-row-<n>` in tables, `loading-spinner` elsewhere |
| Pagination | `<scope>-pagination`, `-pagination-previous`, `-pagination-next`, `-pagination-page`, `-pagination-summary` |
| Tabs | `<scope>-tab-<name>` and its panel `<scope>-panel-<name>` (e.g. `student-tab-fees`) |

`<record id>` is the record's database ID (a UUID). Tests usually find a row by its content first, then use the row's ID for its buttons:

```ts
const row = page.locator('[data-testid^="staff-row-"]', { hasText: 'Amal' }).first();
const rowId = await row.getAttribute('data-testid'); // "staff-row-<uuid>"
await page.getByTestId(`${rowId}-edit`).click();
```

You can also match by prefix and suffix: `[data-testid^="students-row-"][data-testid$="-edit"]`.

## Other common IDs

- Navigation: `sidebar-nav-<page>` on desktop and `mobile-menu-nav-<page>` in the phone menu. `<page>` is one of `dashboard`, `students`, `classes`, `staff`, `reports-students`, `reports-fee-collection`, `reports-outstanding`, `settings-organization`, `settings-branding`, `settings-users`, `settings-academic-years` or `settings-export`. Open the phone menu with `header-open-menu`.
- Top bar: `language-menu` → `language-en` / `language-ar`; `user-menu` → `user-menu-name`, `user-menu-role`, `user-menu-change-password`, `user-menu-sign-out`.
- Breadcrumbs: `breadcrumbs`, items `breadcrumb-0`, `breadcrumb-1` and so on.
- Sign-in: `login-username`, `login-password`, `login-password-toggle`, `login-submit`, `login-error`.
- Dashboard: `dashboard-kpi-active-students-value`, `dashboard-kpi-collected-this-month-value`, `dashboard-kpi-total-outstanding-value`, `dashboard-payment-row-<payment id>`.
- Student page: `student-edit`, `student-toggle-status`, `student-profile-<field>` (e.g. `student-profile-admission-no`).
- Fees tab: `student-fees-add`, `student-fees-summary-outstanding`, a fee card `student-fees-fee-<fee id>` with `-record-payment`, `-edit`, `-status`, `-outstanding`, and payments `student-fees-fee-<fee id>-payment-<payment id>` with `-void`.
- Guardians tab: `student-guardians-add`, a card `student-guardians-<guardian id>` with `-edit`, `-make-primary`, `-delete`.
- Reports: `report-<name>-export`, `report-<name>-total`, `report-<name>-filter-<from|to|dueBefore|class|status|method>`.

Pop-up notifications (toasts) come from the Sonner library. Select them with `[data-sonner-toast]`.

## For developers

IDs come from `src/lib/testId.tsx`. Shared components (`FormField`, `DataTable`, `SearchInput`, `PageHeader`, `DialogContent`, `Tabs` and others) build their IDs from the nearest `<TestIdScope>`. A new page needs a scope and IDs only for its own buttons, links and filters. `DialogContent`, `SheetContent` and `ConfirmDialog` require a `testId`. IDs must stay unique on a page, so check the page after adding controls. Keep the IDs QA already uses stable: changing one breaks their tests.
