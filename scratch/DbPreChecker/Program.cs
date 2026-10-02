using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Npgsql;

namespace DbPreChecker;

class Program
{
    private static readonly string Pwd = "Thari@123@#";
    private static readonly string ActualProductVersion = "8.0.11";

    private static readonly List<string> ConnStrs = new()
    {
        $"Host=aws-0-ap-northeast-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.xbpzwrvwmcysyjdcjssz;Password={Pwd};SSL Mode=Require;Trust Server Certificate=true;Timeout=10;",
        $"Host=aws-0-ap-northeast-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.xbpzwrvwmcysyjdcjssz;Password={Pwd};SSL Mode=Require;Trust Server Certificate=true;Timeout=10;",
        $"Host=db.xbpzwrvwmcysyjdcjssz.supabase.co;Port=5432;Database=postgres;Username=postgres;Password={Pwd};SSL Mode=Require;Trust Server Certificate=true;Timeout=10;"
    };

    static async Task Main(string[] args)
    {
        Console.WriteLine("==================================================");
        Console.WriteLine("CONTROLLED SUPABASE BASELINE SYNCHRONIZATION RUNNER");
        Console.WriteLine("==================================================");

        string workingConnStr = null;
        NpgsqlConnection conn = null;

        foreach (var cs in ConnStrs)
        {
            var builder = new NpgsqlConnectionStringBuilder(cs);
            Console.Write($"Connecting to {builder.Host}:{builder.Port}... ");
            try
            {
                conn = new NpgsqlConnection(cs);
                await conn.OpenAsync();
                Console.WriteLine("CONNECTED SUCCESS!");
                workingConnStr = cs;
                break;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"FAILED ({ex.Message})");
            }
        }

        if (conn == null)
        {
            Console.WriteLine("\nCRITICAL ERROR: Connection to active Supabase database failed!");
            return;
        }

        using (conn)
        {
            // ==================================================
            // STEP 1 — FINAL READ-ONLY PRE-CHECK
            // ==================================================
            Console.WriteLine("\n--------------------------------------------------");
            Console.WriteLine("STEP 1: PRE-CHECK VERIFICATION");
            Console.WriteLine("--------------------------------------------------");

            bool eFMigrationsHistoryExists = false;
            await using (var cmd = new NpgsqlCommand("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '__EFMigrationsHistory');", conn))
            {
                eFMigrationsHistoryExists = (bool)(await cmd.ExecuteScalarAsync())!;
            }
            Console.WriteLine($"1. __EFMigrationsHistory table exists: {eFMigrationsHistoryExists}");

            bool mig1Recorded = false;
            bool mig2Recorded = false;
            if (eFMigrationsHistoryExists)
            {
                await using (var cmd = new NpgsqlCommand("SELECT \"MigrationId\" FROM \"__EFMigrationsHistory\";", conn))
                await using (var rdr = await cmd.ExecuteReaderAsync())
                {
                    while (await rdr.ReadAsync())
                    {
                        var mId = rdr.GetString(0);
                        if (mId == "20260913135758_AddVendorApplicationEnhancedFields") mig1Recorded = true;
                        if (mId == "20260913150307_AddPasswordResetToken") mig2Recorded = true;
                    }
                }
            }
            Console.WriteLine($"2. Migration 1 recorded: {mig1Recorded}");
            Console.WriteLine($"3. Migration 2 recorded: {mig2Recorded}");

            bool vendorAppsExists = false;
            await using (var cmd = new NpgsqlCommand("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vendor_applications');", conn))
            {
                vendorAppsExists = (bool)(await cmd.ExecuteScalarAsync())!;
            }
            Console.WriteLine($"4. vendor_applications table exists: {vendorAppsExists}");

            bool busRegColExists = false;
            if (vendorAppsExists)
            {
                await using (var cmd = new NpgsqlCommand("SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vendor_applications' AND column_name = 'BusinessRegistrationNumber');", conn))
                {
                    busRegColExists = (bool)(await cmd.ExecuteScalarAsync())!;
                }
            }
            Console.WriteLine($"5. vendor_applications.BusinessRegistrationNumber column exists: {busRegColExists}");

            bool busRegIdxExists = false;
            await using (var cmd = new NpgsqlCommand("SELECT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'vendor_applications' AND indexname = 'IX_vendor_applications_BusinessRegistrationNumber');", conn))
            {
                busRegIdxExists = (bool)(await cmd.ExecuteScalarAsync())!;
            }
            Console.WriteLine($"6. IX_vendor_applications_BusinessRegistrationNumber index exists: {busRegIdxExists}");

            bool pwdTokensExists = false;
            await using (var cmd = new NpgsqlCommand("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'password_reset_tokens');", conn))
            {
                pwdTokensExists = (bool)(await cmd.ExecuteScalarAsync())!;
            }
            Console.WriteLine($"7. password_reset_tokens table exists: {pwdTokensExists}");

            bool usersExists = false;
            await using (var cmd = new NpgsqlCommand("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users');", conn))
            {
                usersExists = (bool)(await cmd.ExecuteScalarAsync())!;
            }
            Console.WriteLine($"8. users table exists: {usersExists}");

            if (!vendorAppsExists || !busRegColExists || !usersExists)
            {
                Console.WriteLine("\nCRITICAL PRE-CHECK FAILURE: Baseline domain tables missing!");
                return;
            }

            // Record initial table count & user row count to verify zero deletion
            long initialUserCount = 0;
            await using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM \"users\";", conn))
            {
                initialUserCount = (long)(await cmd.ExecuteScalarAsync())!;
            }
            Console.WriteLine($"9. Initial users row count: {initialUserCount}");

            // ==================================================
            // EXECUTE NON-DESTRUCTIVE CONTROLLED SYNCHRONIZATION
            // ==================================================
            Console.WriteLine("\n--------------------------------------------------");
            Console.WriteLine("EXECUTING CONTROLLED NON-DESTRUCTIVE SYNCHRONIZATION");
            Console.WriteLine("--------------------------------------------------");

            await using (var tx = await conn.BeginTransactionAsync())
            {
                try
                {
                    // Step 2 — Create __EFMigrationsHistory and record Migration 1
                    Console.WriteLine("Step 2: Ensuring __EFMigrationsHistory & recording Migration 1...");
                    var sqlCreateHistoryTable = @"
                    CREATE TABLE IF NOT EXISTS ""__EFMigrationsHistory"" (
                        ""MigrationId"" character varying(150) NOT NULL,
                        ""ProductVersion"" character varying(32) NOT NULL,
                        CONSTRAINT ""PK___EFMigrationsHistory"" PRIMARY KEY (""MigrationId"")
                    );";
                    await using (var cmd = new NpgsqlCommand(sqlCreateHistoryTable, conn, tx))
                    {
                        await cmd.ExecuteNonQueryAsync();
                    }

                    var sqlInsertMig1 = $@"
                    INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
                    VALUES ('20260913135758_AddVendorApplicationEnhancedFields', '{ActualProductVersion}')
                    ON CONFLICT (""MigrationId"") DO NOTHING;";
                    await using (var cmd = new NpgsqlCommand(sqlInsertMig1, conn, tx))
                    {
                        await cmd.ExecuteNonQueryAsync();
                    }

                    // Step 3 — Create IX_vendor_applications_BusinessRegistrationNumber
                    Console.WriteLine("Step 3: Creating IX_vendor_applications_BusinessRegistrationNumber...");
                    var sqlCreateBusRegIdx = @"
                    CREATE INDEX IF NOT EXISTS ""IX_vendor_applications_BusinessRegistrationNumber""
                    ON ""vendor_applications"" (""BusinessRegistrationNumber"");";
                    await using (var cmd = new NpgsqlCommand(sqlCreateBusRegIdx, conn, tx))
                    {
                        await cmd.ExecuteNonQueryAsync();
                    }

                    // Step 4 — Apply Migration 2 (password_reset_tokens table & 2 indexes)
                    Console.WriteLine("Step 4: Creating password_reset_tokens table and indexes...");
                    var sqlCreatePwdTokensTable = @"
                    CREATE TABLE IF NOT EXISTS ""password_reset_tokens"" (
                        ""Id"" uuid NOT NULL,
                        ""UserId"" uuid NOT NULL,
                        ""TokenHash"" character varying(255) NOT NULL,
                        ""TokenType"" character varying(50) NOT NULL,
                        ""ExpiresAt"" timestamp with time zone NOT NULL,
                        ""IsUsed"" boolean NOT NULL,
                        ""UsedAt"" timestamp with time zone NULL,
                        ""CreatedAt"" timestamp with time zone NOT NULL,
                        ""UpdatedAt"" timestamp with time zone NULL,
                        CONSTRAINT ""PK_password_reset_tokens"" PRIMARY KEY (""Id""),
                        CONSTRAINT ""FK_password_reset_tokens_users_UserId"" FOREIGN KEY (""UserId"") 
                            REFERENCES ""users"" (""Id"") ON DELETE CASCADE
                    );";
                    await using (var cmd = new NpgsqlCommand(sqlCreatePwdTokensTable, conn, tx))
                    {
                        await cmd.ExecuteNonQueryAsync();
                    }

                    var sqlCreateIdxTokenHash = @"
                    CREATE INDEX IF NOT EXISTS ""IX_password_reset_tokens_TokenHash"" 
                    ON ""password_reset_tokens"" (""TokenHash"");";
                    await using (var cmd = new NpgsqlCommand(sqlCreateIdxTokenHash, conn, tx))
                    {
                        await cmd.ExecuteNonQueryAsync();
                    }

                    var sqlCreateIdxUserId = @"
                    CREATE INDEX IF NOT EXISTS ""IX_password_reset_tokens_UserId"" 
                    ON ""password_reset_tokens"" (""UserId"");";
                    await using (var cmd = new NpgsqlCommand(sqlCreateIdxUserId, conn, tx))
                    {
                        await cmd.ExecuteNonQueryAsync();
                    }

                    // Step 5 — Record Migration 2 in __EFMigrationsHistory
                    Console.WriteLine("Step 5: Recording Migration 2 in __EFMigrationsHistory...");
                    var sqlInsertMig2 = $@"
                    INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
                    VALUES ('20260913150307_AddPasswordResetToken', '{ActualProductVersion}')
                    ON CONFLICT (""MigrationId"") DO NOTHING;";
                    await using (var cmd = new NpgsqlCommand(sqlInsertMig2, conn, tx))
                    {
                        await cmd.ExecuteNonQueryAsync();
                    }

                    await tx.CommitAsync();
                    Console.WriteLine("SYNCHRONIZATION TRANSACTION COMMITTED SUCCESSFULLY!");
                }
                catch (Exception ex)
                {
                    await tx.RollbackAsync();
                    Console.WriteLine($"\nCRITICAL EXECUTION ERROR: {ex.Message}");
                    return;
                }
            }

            // ==================================================
            // STEP 6 — POST-EXECUTION VERIFICATION
            // ==================================================
            Console.WriteLine("\n--------------------------------------------------");
            Console.WriteLine("STEP 6: POST-EXECUTION READ-ONLY VERIFICATION");
            Console.WriteLine("--------------------------------------------------");

            // 1. __EFMigrationsHistory exists
            bool postHistoryExists = false;
            await using (var cmd = new NpgsqlCommand("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '__EFMigrationsHistory');", conn))
            {
                postHistoryExists = (bool)(await cmd.ExecuteScalarAsync())!;
            }
            Console.WriteLine($"[Check 1] __EFMigrationsHistory table exists: {postHistoryExists}");

            // 2 & 3. Migration 1 and Migration 2 recorded
            bool postMig1 = false;
            bool postMig2 = false;
            string ver1 = null, ver2 = null;
            await using (var cmd = new NpgsqlCommand("SELECT \"MigrationId\", \"ProductVersion\" FROM \"__EFMigrationsHistory\" ORDER BY \"MigrationId\";", conn))
            await using (var rdr = await cmd.ExecuteReaderAsync())
            {
                while (await rdr.ReadAsync())
                {
                    var mId = rdr.GetString(0);
                    var ver = rdr.GetString(1);
                    if (mId == "20260913135758_AddVendorApplicationEnhancedFields") { postMig1 = true; ver1 = ver; }
                    if (mId == "20260913150307_AddPasswordResetToken") { postMig2 = true; ver2 = ver; }
                }
            }
            Console.WriteLine($"[Check 2] Migration 1 recorded: {postMig1} (Version: {ver1})");
            Console.WriteLine($"[Check 3] Migration 2 recorded: {postMig2} (Version: {ver2})");

            // 4. password_reset_tokens table exists
            bool postPwdTokensExists = false;
            await using (var cmd = new NpgsqlCommand("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'password_reset_tokens');", conn))
            {
                postPwdTokensExists = (bool)(await cmd.ExecuteScalarAsync())!;
            }
            Console.WriteLine($"[Check 4] password_reset_tokens table exists: {postPwdTokensExists}");

            // 5 & 6. TokenHash is varchar(255) & TokenType is varchar(50)
            string tokenHashDataType = null, tokenTypeDataType = null;
            int? tokenHashMaxLen = null, tokenTypeMaxLen = null;
            await using (var cmd = new NpgsqlCommand(@"
                SELECT column_name, data_type, character_maximum_length 
                FROM information_schema.columns 
                WHERE table_name = 'password_reset_tokens' 
                  AND column_name IN ('TokenHash', 'TokenType');", conn))
            await using (var rdr = await cmd.ExecuteReaderAsync())
            {
                while (await rdr.ReadAsync())
                {
                    var colName = rdr.GetString(0);
                    var dType = rdr.GetString(1);
                    var maxLen = rdr.IsDBNull(2) ? (int?)null : rdr.GetInt32(2);
                    if (colName == "TokenHash") { tokenHashDataType = dType; tokenHashMaxLen = maxLen; }
                    if (colName == "TokenType") { tokenTypeDataType = dType; tokenTypeMaxLen = maxLen; }
                }
            }
            Console.WriteLine($"[Check 5] TokenHash Data Type: {tokenHashDataType}({tokenHashMaxLen})");
            Console.WriteLine($"[Check 6] TokenType Data Type: {tokenTypeDataType}({tokenTypeMaxLen})");

            // 7. UserId FK exists with ON DELETE CASCADE
            bool fkExists = false;
            string deleteRule = null;
            await using (var cmd = new NpgsqlCommand(@"
                SELECT rc.delete_rule 
                FROM information_schema.table_constraints tc
                JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
                WHERE tc.table_name = 'password_reset_tokens' 
                  AND tc.constraint_name = 'FK_password_reset_tokens_users_UserId';", conn))
            await using (var rdr = await cmd.ExecuteReaderAsync())
            {
                if (await rdr.ReadAsync())
                {
                    fkExists = true;
                    deleteRule = rdr.GetString(0);
                }
            }
            Console.WriteLine($"[Check 7] FK_password_reset_tokens_users_UserId exists: {fkExists} (Delete Rule: {deleteRule})");

            // 8 & 9. TokenHash & UserId indexes exist
            bool idxTokenHashExists = false;
            bool idxUserIdExists = false;
            await using (var cmd = new NpgsqlCommand(@"
                SELECT indexname FROM pg_indexes 
                WHERE tablename = 'password_reset_tokens';", conn))
            await using (var rdr = await cmd.ExecuteReaderAsync())
            {
                while (await rdr.ReadAsync())
                {
                    var idx = rdr.GetString(0);
                    if (idx == "IX_password_reset_tokens_TokenHash") idxTokenHashExists = true;
                    if (idx == "IX_password_reset_tokens_UserId") idxUserIdExists = true;
                }
            }
            Console.WriteLine($"[Check 8] IX_password_reset_tokens_TokenHash index exists: {idxTokenHashExists}");
            Console.WriteLine($"[Check 9] IX_password_reset_tokens_UserId index exists: {idxUserIdExists}");

            // 10. BusinessRegistrationNumber index exists
            bool postBusRegIdxExists = false;
            await using (var cmd = new NpgsqlCommand(@"
                SELECT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'vendor_applications' AND indexname = 'IX_vendor_applications_BusinessRegistrationNumber');", conn))
            {
                postBusRegIdxExists = (bool)(await cmd.ExecuteScalarAsync())!;
            }
            Console.WriteLine($"[Check 10] IX_vendor_applications_BusinessRegistrationNumber index exists: {postBusRegIdxExists}");

            // 11. Existing 30 baseline tables remain present
            int totalTables = 0;
            await using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';", conn))
            {
                totalTables = Convert.ToInt32(await cmd.ExecuteScalarAsync());
            }
            Console.WriteLine($"[Check 11 & 13] Total public schema tables count: {totalTables} (Expected: 32 = 30 baseline + __EFMigrationsHistory + password_reset_tokens)");

            // 12. No existing rows were deleted
            long postUserCount = 0;
            await using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM \"users\";", conn))
            {
                postUserCount = (long)(await cmd.ExecuteScalarAsync())!;
            }
            Console.WriteLine($"[Check 12] Users row count before: {initialUserCount} | Users row count after: {postUserCount}");

            if (postHistoryExists && postMig1 && postMig2 && postPwdTokensExists &&
                tokenHashMaxLen == 255 && tokenTypeMaxLen == 50 && fkExists && deleteRule == "CASCADE" &&
                idxTokenHashExists && idxUserIdExists && postBusRegIdxExists && postUserCount == initialUserCount)
            {
                Console.WriteLine("\nFINAL SYNCHRONIZATION RESULT: SUCCESS");
            }
            else
            {
                Console.WriteLine("\nFINAL SYNCHRONIZATION RESULT: VERIFICATION_FAILED");
            }
        }
    }
}
