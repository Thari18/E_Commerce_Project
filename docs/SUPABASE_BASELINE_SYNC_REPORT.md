# LocalMart — Supabase Baseline Synchronization Final Report

**Execution Date:** September 24, 2026  
**Executed By:** Lead Technical Architect & Database Engineer  
**Target Database:** Supabase-Managed PostgreSQL  
**Target Regional Pooler:** `aws-0-ap-northeast-1.pooler.supabase.com:6543`  
**Verified EF Core ProductVersion:** `8.0.11`  
**Final Status:** **SUCCESS**

---

## 1. Step 1: Pre-Check Verification Results

Prior to execution, a read-only schema probe was executed against the active Supabase PostgreSQL database:

| Pre-Check Item | Verification Criterion | Pre-Check Result | Live Status |
| :--- | :--- | :--- | :--- |
| 1. `__EFMigrationsHistory` Table | Table exists in `public` schema | **MISSING** | Table missing before transaction |
| 2. Migration 1 (`20260913135758...`) | Recorded in `__EFMigrationsHistory` | **NOT RECORDED** | Missing metadata entry |
| 3. Migration 2 (`20260913150307...`) | Recorded in `__EFMigrationsHistory` | **NOT RECORDED** | Migration pending |
| 4. `vendor_applications` Table | Table exists in `public` schema | **PRESENT** | Baseline domain table exists |
| 5. `BusinessRegistrationNumber` Column | Column present in `vendor_applications` | **PRESENT** | Enhanced field exists |
| 6. `IX_vendor_applications_BusinessRegistrationNumber` | Index exists in `pg_indexes` | **MISSING** | Index missing before transaction |
| 7. `password_reset_tokens` Table | Table exists in `public` schema | **MISSING** | Table missing before transaction |
| 8. `users` Table | Table exists in `public` schema | **PRESENT** | Core user table exists (4 rows) |
| 9. Baseline Domain Tables | 30 initial domain entity tables | **PRESENT** | All 30 baseline tables intact |

---

## 2. Actual EF Core Version Identification

- **Project Configuration File:** `src/LocalMart.Infrastructure/LocalMart.Infrastructure.csproj`
- **EF Core Package Dependencies:**
  - `Npgsql.EntityFrameworkCore.PostgreSQL`: Version `8.0.11`
  - `Microsoft.EntityFrameworkCore.Tools`: Version `8.0.11`
  - `Microsoft.EntityFrameworkCore.Design`: Version `8.0.11`
- **Migration Designer Metadata:** `20260913150307_AddPasswordResetToken.Designer.cs` (`[HasAnnotation("ProductVersion", "8.0.11")]`)
- **Verified ProductVersion Used for Metadata Baseline:** **`8.0.11`**

---

## 3. Controlled Non-Destructive Synchronization Transaction

The non-destructive baseline synchronization was executed as an atomic SQL transaction:

```sql
BEGIN;

-- 1. Create __EFMigrationsHistory tracking table
CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

-- 2. Record Baseline Migration 1 Metadata Only
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260913135758_AddVendorApplicationEnhancedFields', '8.0.11')
ON CONFLICT ("MigrationId") DO NOTHING;

-- 3. Create missing index on vendor_applications
CREATE INDEX IF NOT EXISTS "IX_vendor_applications_BusinessRegistrationNumber"
ON "vendor_applications" ("BusinessRegistrationNumber");

-- 4. Create password_reset_tokens table matching Migration 2 schema
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "Id" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "TokenHash" character varying(255) NOT NULL,
    "TokenType" character varying(50) NOT NULL,
    "ExpiresAt" timestamp with time zone NOT NULL,
    "IsUsed" boolean NOT NULL,
    "UsedAt" timestamp with time zone NULL,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NULL,
    CONSTRAINT "PK_password_reset_tokens" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_password_reset_tokens_users_UserId" FOREIGN KEY ("UserId") 
        REFERENCES "users" ("Id") ON DELETE CASCADE
);

-- 5. Create indexes for password_reset_tokens
CREATE INDEX IF NOT EXISTS "IX_password_reset_tokens_TokenHash" 
ON "password_reset_tokens" ("TokenHash");

CREATE INDEX IF NOT EXISTS "IX_password_reset_tokens_UserId" 
ON "password_reset_tokens" ("UserId");

-- 6. Record Migration 2 in __EFMigrationsHistory
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260913150307_AddPasswordResetToken', '8.0.11')
ON CONFLICT ("MigrationId") DO NOTHING;

COMMIT;
```

---

## 4. Post-Execution Read-Only Verification (13 Checks)

Immediately following transaction commit, 13 independent read-only SQL verification checks were executed:

| Verification Check # | Verification Requirement | Expected Output | Live Verified Output in Supabase | Result |
| :--- | :--- | :--- | :--- | :--- |
| **Check 1** | `__EFMigrationsHistory` exists | `true` | `True` | **PASSED** |
| **Check 2** | Migration 1 recorded | `20260913135758...` (v8.0.11) | `True` (ProductVersion: `8.0.11`) | **PASSED** |
| **Check 3** | Migration 2 recorded | `20260913150307...` (v8.0.11) | `True` (ProductVersion: `8.0.11`) | **PASSED** |
| **Check 4** | `password_reset_tokens` exists | `true` | `True` | **PASSED** |
| **Check 5** | `TokenHash` Data Type | `character varying(255)` | `character varying(255)` | **PASSED** |
| **Check 6** | `TokenType` Data Type | `character varying(50)` | `character varying(50)` | **PASSED** |
| **Check 7** | `UserId` Foreign Key | FK to `users("Id")` (`CASCADE`) | `FK_password_reset_tokens_users_UserId` (`CASCADE`) | **PASSED** |
| **Check 8** | `TokenHash` Index | `IX_password_reset_tokens_TokenHash` | `IX_password_reset_tokens_TokenHash` present | **PASSED** |
| **Check 9** | `UserId` Index | `IX_password_reset_tokens_UserId` | `IX_password_reset_tokens_UserId` present | **PASSED** |
| **Check 10** | `BusinessRegistrationNumber` Index | `IX_vendor_applications_...` | `IX_vendor_applications_BusinessRegistrationNumber` present | **PASSED** |
| **Check 11** | Total Schema Table Count | 32 tables (30 baseline + 2) | **32 tables present in public schema** | **PASSED** |
| **Check 12** | Data Preservation | Users count unchanged | **4 rows before = 4 rows after (0 rows lost)** | **PASSED** |
| **Check 13** | Unrelated Schema | 0 dropped tables/columns | **0 dropped tables / 0 altered column types** | **PASSED** |

---

## 5. Application Startup Verification

- **ASP.NET Core Web API:** Verified operational on `http://localhost:5000` (Swagger OpenAPI endpoint `/swagger/v1/swagger.json` responding cleanly).
- **Angular Frontend:** Verified operational on `http://localhost:4200` (Google Chrome live session active).

---

## 6. Final Execution Status

**FINAL STATUS:** **SUCCESS**

### Execution Summary:
- Migration 1 metadata recorded in `__EFMigrationsHistory` (`8.0.11`).
- Index `IX_vendor_applications_BusinessRegistrationNumber` created safely.
- Table `password_reset_tokens` and its two indexes created matching exact Migration 2 schema.
- Migration 2 metadata recorded in `__EFMigrationsHistory` (`8.0.11`).
- 0 tables dropped, 0 rows deleted, 0 column types altered.
- All 13 post-execution read-only verification checks passed.
