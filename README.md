# cs490-groupProject-backend

## Payment API

The backend payment flow currently supports recordkeeping-first payment and subscription management for coaching relationships.

### Endpoints

`POST /api/payments`

Creates a payment for an authenticated client with an active client-coach relationship.

Example request body:

```json
{
	"coach_id": 7,
	"payment_method": "card",
	"currency": "USD"
}
```

Example success response:

```json
{
	"message": "Payment recorded successfully.",
	"payment": {
		"payment_id": 100,
		"client_id": 11,
		"coach_id": 7,
		"transaction_id": "txn_...",
		"payment_method": "card",
		"payment_amount": "49.99",
		"payment_status": "completed",
		"currency": "USD"
	},
	"subscription": {
		"subscription_id": 200,
		"client_id": 11,
		"coach_id": 7,
		"payment_id": 100,
		"start_date": "2026-04-22",
		"end_date": "2026-05-22",
		"status": "active"
	}
}
```

`GET /api/payments/history`

Returns payment history for the authenticated client.

`GET /api/payments/earnings`

Returns earnings summary and recent completed payments for the authenticated coach.

`GET /api/payments/stats`

Returns payment totals and status breakdown for admins.

### Current backend rules

- Payment creation requires an active client-coach relationship.
- Coach pricing is read from the existing coach profile price field.
- Payment processing is internal recordkeeping only. There is no external gateway integration yet.
- Unhiring a coach cancels future subscription billing state but does not refund historical payments.

## Backend Test Workflow

### Unit and request tests

Run the mocked backend request tests:

```bash
npm test
```

### Real database integration tests

The backend includes a real database integration workflow using the Sequelize `test` environment.

This project is intended to run those integration tests against a MySQL test database when that server is available. There is no sqlite test setup in the repo.

Prepare the test database:

```bash
npm run test:db:create
npm run test:db:migrate
```

If the MySQL test database is provisioned separately and the app user does not have `CREATE DATABASE` permissions, skip `test:db:create` and run only:

```bash
npm run test:db:migrate
```

Or reset it from scratch:

```bash
npm run test:db:reset
```

`test:db:reset` also requires database create and drop permissions.

Run the real persistence tests:

```bash
npm run test:integration
```

These integration tests verify that payment and subscription records can be written and updated through Sequelize against the configured MySQL test database.
