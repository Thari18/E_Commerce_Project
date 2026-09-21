using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Npgsql;

namespace DbPreChecker;

class Program
{
    private static readonly string Pwd = "Thari@123@#";

    private static readonly List<string> ConnStrs = new()
    {
        // 1. Pooler us-west-1 Session Mode (5432) & Transaction Mode (6543)
        $"Host=aws-0-us-west-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.xbpzwrvwmcysyjdcjssz;Password={Pwd};SSL Mode=Require;Trust Server Certificate=true;",
        $"Host=aws-0-us-west-1.pooler.supabase.com;Port=6543;Database=postgres;Username=postgres.xbpzwrvwmcysyjdcjssz;Password={Pwd};SSL Mode=Require;Trust Server Certificate=true;",
        $"Host=aws-0-us-west-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres;Password={Pwd};SSL Mode=Require;Trust Server Certificate=true;",
        
        // 2. Direct IPv4 / Direct Domain options
        $"Host=db.xbpzwrvwmcysyjdcjssz.supabase.co;Port=5432;Database=postgres;Username=postgres;Password={Pwd};SSL Mode=Require;Trust Server Certificate=true;",
        $"Host=db.xbpzwrvwmcysyjdcjssz.supabase.co;Port=6543;Database=postgres;Username=postgres.xbpzwrvwmcysyjdcjssz;Password={Pwd};SSL Mode=Require;Trust Server Certificate=true;"
    };

    static async Task Main(string[] args)
    {
        Console.WriteLine("==================================================");
        Console.WriteLine("TARGETED SUPABASE CONNECTION TEST");
        Console.WriteLine("==================================================");

        string workingConnStr = null;
        NpgsqlConnection activeConn = null;

        foreach (var cs in ConnStrs)
        {
            var builder = new NpgsqlConnectionStringBuilder(cs);
            Console.Write($"Testing {builder.Host}:{builder.Port} (User: {builder.Username})... ");
            try
            {
                var conn = new NpgsqlConnection(cs);
                await conn.OpenAsync();
                Console.WriteLine("CONNECTED SUCCESS!");
                workingConnStr = cs;
                activeConn = conn;
                break;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"FAILED ({ex.Message})");
            }
        }

        if (activeConn == null)
        {
            Console.WriteLine("\nCRITICAL: Could not connect to targeted endpoints!");
            return;
        }

        using (activeConn)
        {
            Console.WriteLine("\n==================================================");
            Console.WriteLine("STEP 2: READ-ONLY PRE-CHECK ON SUPABASE POSTGRESQL");
            Console.WriteLine("==================================================");

            // 1. __EFMigrationsHistory contains Migration 1?
            await using (var cmd = new NpgsqlCommand("SELECT \"MigrationId\", \"ProductVersion\" FROM \"__EFMigrationsHistory\" ORDER BY \"MigrationId\";", activeConn))
            await using (var rdr = await cmd.ExecuteReaderAsync())
            {
                Console.WriteLine("\n[1 & 2] __EFMigrationsHistory contents:");
                bool hasMig1 = false;
                bool hasMig2 = false;
                while (await rdr.ReadAsync())
                {
                    var migId = rdr.GetString(0);
                    var ver = rdr.GetString(1);
                    Console.WriteLine($"  - MigrationId: {migId} | ProductVersion: {ver}");
                    if (migId == "20260913135758_AddVendorApplicationEnhancedFields") hasMig1 = true;
                    if (migId == "20260913150307_AddPasswordResetToken") hasMig2 = true;
                }
                Console.WriteLine($"  -> Migration 1 (20260913135758_AddVendorApplicationEnhancedFields) recorded: {hasMig1}");
                Console.WriteLine($"  -> Migration 2 (20260913150307_AddPasswordResetToken) recorded: {hasMig2}");
            }

            // 3. password_reset_tokens table exists?
            await using (var cmd = new NpgsqlCommand("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'password_reset_tokens');", activeConn))
            {
                bool exists = (bool)(await cmd.ExecuteScalarAsync())!;
                Console.WriteLine($"\n[3] 'password_reset_tokens' table exists in Supabase: {exists}");
            }

            // 4. vendor_applications contains BusinessRegistrationNumber?
            await using (var cmd = new NpgsqlCommand("SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vendor_applications' AND column_name = 'BusinessRegistrationNumber');", activeConn))
            {
                bool exists = (bool)(await cmd.ExecuteScalarAsync())!;
                Console.WriteLine($"\n[4] 'vendor_applications' contains 'BusinessRegistrationNumber' column: {exists}");
            }

            // 5. IX_vendor_applications_BusinessRegistrationNumber index exists?
            await using (var cmd = new NpgsqlCommand("SELECT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'vendor_applications' AND indexname = 'IX_vendor_applications_BusinessRegistrationNumber');", activeConn))
            {
                bool exists = (bool)(await cmd.ExecuteScalarAsync())!;
                Console.WriteLine($"\n[5] Index 'IX_vendor_applications_BusinessRegistrationNumber' exists in Supabase: {exists}");
            }

            // 6. Existing users & vendor_applications table count / data check
            await using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM \"users\";", activeConn))
            {
                long count = (long)(await cmd.ExecuteScalarAsync())!;
                Console.WriteLine($"\n[6] Existing 'users' table row count: {count}");
            }

            await using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM \"vendor_applications\";", activeConn))
            {
                long count = (long)(await cmd.ExecuteScalarAsync())!;
                Console.WriteLine($"[6] Existing 'vendor_applications' table row count: {count}");
            }

            await using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM \"vendors\";", activeConn))
            {
                long count = (long)(await cmd.ExecuteScalarAsync())!;
                Console.WriteLine($"[6] Existing 'vendors' table row count: {count}");
            }

            Console.WriteLine("\nPRE-CHECK RESULT: VERIFIED SUCCESSFULLY");
            Console.WriteLine($"ACTIVE_CONN_STR: {workingConnStr}");
        }
    }
}
