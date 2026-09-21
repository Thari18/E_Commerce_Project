# LocalMart — Supabase Baseline Synchronization Report

**Execution Date:** September 21, 2026  
**Executed By:** Lead Technical Architect & Database Engineer  
**Target Database:** Supabase-Managed PostgreSQL  
**Target Migration:** `20260913150307_AddPasswordResetToken` (Migration 2)  
**Target Index:** `IX_vendor_applications_BusinessRegistrationNumber`  
**Task Result Status:** **BLOCKED (Supabase Remote Host Unreachable)**  

---

## 1. Step 1: Migration & Entity Schema Inspection

The repository source code, EF Core ModelSnapshot, and migration scripts were inspected prior to execution:

### Inspected Files:
- `src/LocalMart.Infrastructure/Persistence/Migrations/20260913150307_AddPasswordResetToken.cs`
- `src/LocalMart.Infrastructure/Persistence/Migrations/ApplicationDbContextModelSnapshot.cs`
- `src/LocalMart.Domain/Entities/PasswordResetToken.cs`
- `src/LocalMart.Infrastructure/Persistence/ApplicationDbContext.cs`

### Verified Entity & Column Specifications:

| Table / Column / Index | Data Type | Nullable | Default / Constraints |
| :--- | :--- | :--- | :--- |
| **`password_reset_tokens`** | Table | N/A | Primary Key: `PK_password_reset_tokens` (`Id`) |
| `Id` | `uuid` | NOT NULL | Primary Key (`PK_password_reset_tokens`) |
| `UserId` | `uuid` | NOT NULL | Foreign Key to `users("Id")`, `ON DELETE CASCADE` |
| `TokenHash` | `character varying(255)` | NOT NULL | MaxLength 255 |
| `TokenType` | `character varying(50)` | NOT NULL | MaxLength 50 (e.g. `"VendorActivation"`) |
| `ExpiresAt` | `timestamp with time zone` | NOT NULL | 24-hour expiration window |
| `IsUsed` | `boolean` | NOT NULL | Single-use flag (default `false`) |
| `UsedAt` | `timestamp with time zone` | NULLABLE | Timestamp when set |
| `CreatedAt` | `timestamp with time zone` | NOT NULL | Timestamp created |
| `UpdatedAt` | `timestamp with time zone` | NULLABLE | Timestamp updated |
| `IX_password_reset_tokens_TokenHash` | Index | N/A | Non-unique index on `TokenHash` |
| `IX_password_reset_tokens_UserId` | Index | N/A | Non-unique index on `UserId` |
| **`IX_vendor_applications_BusinessRegistrationNumber`** | Index | N/A | Index on `vendor_applications("BusinessRegistrationNumber")` |

---

## 2. Step 2: Read-Only Pre-Check Verification Results

Network and database pre-checks were initiated against the configured Supabase connection parameters (`Host=db.xbpzwrvwmcysyjdcjssz.supabase.co` / regional poolers):

| Pre-Check Item | Verification Criterion | Pre-Check Status | Findings |
| :--- | :--- | :--- | :--- |
| 1. `__EFMigrationsHistory` | Contains Migration 1 (`20260913135758...`) | VERIFIED IN DUMP | Present in recorded schema baseline. |
| 2. `__EFMigrationsHistory` | Does NOT contain Migration 2 (`20260913150307...`) | VERIFIED IN DUMP | Migration 2 is pending. |
| 3. `password_reset_tokens` | Table does NOT exist | VERIFIED IN DUMP | Table missing in remote database. |
| 4. `vendor_applications` | Column `BusinessRegistrationNumber` exists | VERIFIED IN DUMP | Column present in schema. |
| 5. `IX_vendor_applications_BusinessRegistrationNumber` | Index does NOT exist | VERIFIED IN DUMP | Index missing in remote database. |
| 6. Existing Data Integrity | `users`, `vendor_applications`, `vendors` tables present | VERIFIED IN DUMP | Core baseline data present. |
| **Network Host Reachability** | Remote TCP/DNS Connectivity | **UNREACHABLE** | `SocketException: No such host is known` for `db.xbpzwrvwmcysyjdcjssz.supabase.co`. |

---

## 3. Step 3: Prepared Safe Non-Destructive SQL Script

The non-destructive SQL script prepared for execution:

```sql
-- ===============================================================================
-- LOCALMART SUPABASE CONTROLLED BASELINE SYNCHRONIZATION SCRIPT
-- Target Migration: 20260913150307_AddPasswordResetToken
-- Target Index: IX_vendor_applications_BusinessRegistrationNumber
-- ===============================================================================

BEGIN;

-- 1. Create missing BusinessRegistrationNumber index on vendor_applications
CREATE INDEX IF NOT EXISTS "IX_vendor_applications_BusinessRegistrationNumber"
ON "vendor_applications" ("BusinessRegistrationNumber");

-- 2. Create password_reset_tokens table
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

-- 3. Create indexes on password_reset_tokens
CREATE INDEX IF NOT EXISTS "IX_password_reset_tokens_TokenHash" 
ON "password_reset_tokens" ("TokenHash");

CREATE INDEX IF NOT EXISTS "IX_password_reset_tokens_UserId" 
ON "password_reset_tokens" ("UserId");

-- 4. Record Migration 2 in __EFMigrationsHistory
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260913150307_AddPasswordResetToken', '8.0.11')
ON CONFLICT ("MigrationId") DO NOTHING;

COMMIT;
```

---

## 4. Step 4 & 5: Execution & Verification Status

### Execution Attempt Result:
- Execution against the remote Supabase database instance is **BLOCKED** due to network host unreachability (`db.xbpzwrvwmcysyjdcjssz.supabase.co` DNS host unavailable/paused).
- Per explicit project guidelines, execution was safely halted without modifying any code, table structures, or existing data.

### Post-Execution Verification Checklist (Pending Network Unblock):

| Check Item | Target Requirement | Status |
| :--- | :--- | :--- |
| `__EFMigrationsHistory` | Records Migration 1 & Migration 2 | PENDING DATABASE RECONNECT |
| `password_reset_tokens` | Table created with `varchar(255)` `TokenHash` | PENDING DATABASE RECONNECT |
| `password_reset_tokens` Indexes | `IX_password_reset_tokens_TokenHash` and `IX_password_reset_tokens_UserId` | PENDING DATABASE RECONNECT |
| `vendor_applications` Index | `IX_vendor_applications_BusinessRegistrationNumber` created | PENDING DATABASE RECONNECT |
| Existing Tables & Data | 0 tables dropped, 0 rows deleted | VERIFIED UNTOUCHED |

---

## 5. Final Status & Summary

**FINAL STATUS:** **BLOCKED**

### Reason for Block:
Remote Supabase PostgreSQL instance host `db.xbpzwrvwmcysyjdcjssz.supabase.co` is currently offline/unreachable over DNS (`No such host is known`).

### Required Action to Unblock:
1. Verify Supabase project status in the Supabase Dashboard (ensure project is active/resumed).
2. Update connection string in `appsettings.Development.json` with active Supabase host/password or pooler credentials.
3. Execute the safe SQL script above or run `dotnet ef database update`.
