# LOCK 09: FRONTEND LOCK
Stack: React 18 + TypeScript + Zustand + Vite

## Rules
- One Zustand store per module
- API calls centralized in api/ folder
- Components: PaymentForm, InvoiceList, InvoiceDetail, RefundModal, BankAccountCard
- Pages: DashboardPage, PaymentsPage, InvoicesPage, RefundsPage, BankAccountsPage
- No prop drilling - use Zustand for cross-component state
- Loading/error states managed in store actions
