.env (lines 1-41): the committed .env contains sensitive keys/real UUIDs and
should not be in source control; add `.env` to .gitignore, remove the tracked
file with `git rm --cached .env`, and instruct developers to use a local copy of
`.env.example` instead. If the repo was pushed publicly, rotate any exposed
Polar price IDs (lines 36-41) and any other leaked keys immediately and replace
them with placeholders in `.env.example`; commit the .gitignore change and the
removal, and communicate the key rotation to the team.

.env.example around lines 20 to 41: the file is missing a trailing newline at
EOF which causes linters to fail; add a single newline character at the end of
the file (ensure the file ends with a blank line) and save so the last line
terminates with a newline.

In db/client.ts around lines 5 to 6, remove the hardcoded DATABASE_URL fallback
containing real credentials; instead rely on process.env.DATABASE_URL (no
embedded secret) or set the fallback to an empty string/undefined and let the
existing error check on line 8 detect missing configuration; update any comments
to note that DATABASE_URL is required and secrets must come from
environment/config management.

In db/index.ts around line 5 the DATABASE_URL fallback contains hardcoded
production credentials; remove the hardcoded URL and ensure the code reads
process.env.DATABASE_URL only (fail fast if missing) or use a non-credential
local default (e.g., localhost without real passwords). Update the file to not
embed secrets, add a .env.example with a placeholder DATABASE_URL, and ensure
deployments/CI provide the real DATABASE_URL via environment variables or secret
store.

In polar_fixes.md (server.ts context) around lines 115 to 124, dotenv.config()
is being called after imports which causes POLAR_ACCESS_TOKEN to be undefined
when src/lib/polar.ts initializes its Polar client; move the dotenv.config()
call to the very top of server.ts (before any imports) so environment variables
are loaded first, and remove the ad-hoc Polar client construction in server.ts —
instead import and reuse the Polar client/factory exported from src/lib/polar.ts
(or call its initializer) and keep the existing null/undefined checks and error
logging by delegating initialization errors to that module or validating the
imported client and logging if it failed.

In polar_fixes.md around lines 147 to 218, the getOrCreatePolarCustomer flow can
create duplicate Polar customers under concurrency and when network errors hide
an existing local polarCustomerId; fix by wrapping DB work in a transaction,
first selecting the polarUsers row with tx.select(...).where(...).limit(1), if a
row exists and has polarCustomerId return the Polar customer (tx scope),
otherwise require a primary email, create the Polar customer, then upsert the
local row using tx.insert(...).onConflictDoUpdate targeting clerkUserId to set
polarCustomerId (instead of separate update/insert), and finally return the
created customer so only one Polar customer is created even under concurrent
requests.

In server.ts around lines 298 to 341, the checkout handler is passing a price ID
into polar.checkouts.create() via products: [priceId], but Polar expects product
IDs; update the contract so the frontend sends productId (product.id) instead of
price.id and include the selected price/interval as a separate field (e.g.,
priceId or interval) if needed; then change the backend to read const {
productId, priceId } = req.body, validate productId exists, call
polar.checkouts.create({ products: [productId], ...(price selection per Polar
SDK if supported via a price or interval parameter), customerId:
polarCustomer.id, successUrl, metadata: { clerk_user_id: clerkUser.id, price_id:
priceId } }); also add input validation and clear error responses when productId
is missing so the checkout request fails fast.
