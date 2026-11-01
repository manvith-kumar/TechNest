# Setup guide (Windows 10/11 + VS Code)

## 1. Install prerequisites
| Tool | Version | Check |
|---|---|---|
| JDK | 21 | `java -version` |
| Maven | 3.9+ | `mvn -v` |
| Node.js | 20 LTS or newer | `node -v` |
| MySQL Server | 8.0+ | `mysql --version` |
| Git | any | `git --version` |

VS Code extensions that help: *Extension Pack for Java*, *Spring Boot Extension Pack*, *ESLint*, *Tailwind CSS IntelliSense*.

## 2. Create the database
Open a terminal and run the script as a MySQL administrator (you will be asked for the root password):

```
mysql -u root -p < database\create_database.sql
```

This creates `technest_db` (development), `technest_test` (integration tests) and a `technest` user whose password is `change_me_dev_only`. **Change that password** if the machine is shared, and use the same value in `backend\.env`.

You do **not** run the schema or seed scripts by hand: Flyway applies `database/migrations/V1__schema.sql` and `V2__seed_data.sql` automatically the first time the backend starts.

## 3. Configure the backend
```
cd backend
copy .env.example .env
```
Edit `backend\.env`:
* `DB_PASSWORD` - the password from step 2.
* `JWT_SECRET` - generate a random value in PowerShell and paste it in:
  ```
  $b = New-Object byte[] 48; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)
  ```
  The backend **refuses to start** if this is missing, shorter than 32 characters, or still the placeholder.
* `LOG_RESET_LINKS=true` (development only) prints password-reset links in the server log, because there is no mail server.

`.env` is git-ignored. Never commit it.

## 4. Start the backend
```
cd backend
mvn spring-boot:run
```
Wait for `Started TechNestApplication`. Check `http://localhost:8080/api/v1/health` returns `{"status":"UP"}`.

## 5. Start the frontend
```
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173**. In development the Vite dev server proxies `/api` and `/uploads` to port 8080, so the browser sees a single origin. Optional overrides live in `frontend\.env.example`.

## 6. Sign in
See *Development credentials* in the README.

## 7. Try the API directly
Any HTTP client works (Postman, curl, VS Code REST Client):
```
curl http://localhost:8080/api/v1/products?size=3
curl -X POST http://localhost:8080/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"customer@technest.dev\",\"password\":\"Customer@12345\"}"
curl http://localhost:8080/api/v1/cart -H "Authorization: Bearer <accessToken from the login response>"
```
The refresh and logout endpoints additionally need the HttpOnly cookie and an `X-Requested-With` header, so test those from the browser.

## 8. Run the tests
```
cd backend && mvn test          # unit tests + integration tests against technest_test
cd frontend && npm test         # Vitest
```
Integration tests need `technest_test` (step 2) and `DB_PASSWORD` available (from `backend\.env` or the environment). They create their own throw-away users.

## Troubleshooting
| Symptom | Cause / fix |
|---|---|
| `JWT_SECRET must be set...` on start | Fill `backend\.env` as in step 3 |
| `Access denied for user 'technest'` | Password in `.env` differs from the one in `create_database.sql` |
| `Unable to obtain connection` / `Communications link failure` | MySQL service is not running |
| Browser shows "Cannot reach the server" | Backend not running, or not on port 8080 (set `VITE_BACKEND_ORIGIN`) |
| Product images are generic placeholders | The sample Unsplash URLs could not be loaded (offline, or a photo was removed). Edit the product in the admin console, or upload an image |
| Signed out in another tab | Refresh tokens rotate on every refresh; two tabs refreshing at the same instant can trip reuse detection. Sign in again |
| Flyway checksum error after editing a migration | Migrations are immutable once applied. Drop and recreate `technest_db`, or add a new `V3__...` migration |
