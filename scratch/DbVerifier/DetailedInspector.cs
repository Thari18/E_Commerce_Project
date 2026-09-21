using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using LocalMart.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace DbVerifier;

class DetailedInspector
{
    public static void Run()
    {
        var jsonText = File.ReadAllText("scratch/supabase_schema_dump.json");
        var doc = JsonDocument.Parse(jsonText);
        var root = doc.RootElement;

        // Build EF Model for Migration 1 (ApplicationDbContext minus password_reset_tokens)
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        optionsBuilder.UseNpgsql("Host=dummy;Database=dummy;");
        using var dbContext = new ApplicationDbContext(optionsBuilder.Options);
        var efModel = dbContext.Model;

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("# DETAILED PER-TABLE VERIFICATION OF ALL 30 TABLES");
        sb.AppendLine("Comparing Migration 1 / EF Core Model against Supabase PostgreSQL\n");

        var tableList = root.EnumerateObject().Select(p => p.Name).OrderBy(x => x).ToList();

        int totalDifferences = 0;

        foreach (var tableName in tableList)
        {
            if (tableName == "__EFMigrationsHistory") continue;

            sb.AppendLine($"================================================================================");
            sb.AppendLine($"TABLE: {tableName}");
            sb.AppendLine($"================================================================================");

            var efEntity = efModel.GetEntityTypes().FirstOrDefault(e => e.GetTableName() == tableName);
            if (efEntity == null)
            {
                sb.AppendLine($"[CRITICAL] Table '{tableName}' NOT FOUND in EF Core Model!");
                totalDifferences++;
                continue;
            }

            var tableObj = root.GetProperty(tableName);
            var dbColsArray = tableObj.GetProperty("Columns").EnumerateArray().ToList();
            var dbConstraintsArray = tableObj.GetProperty("Constraints").EnumerateArray().ToList();
            var dbIndexesArray = tableObj.GetProperty("Indexes").EnumerateArray().ToList();

            // 1. COLUMNS
            sb.AppendLine("\n--- COLUMNS ---");
            var dbColMap = dbColsArray.ToDictionary(c => c.GetProperty("Name").GetString()!, c => c);
            var efPropMap = efEntity.GetProperties().ToDictionary(p => p.GetColumnName(), p => p);

            foreach (var kvp in efPropMap)
            {
                var colName = kvp.Key;
                var efProp = kvp.Value;

                if (!dbColMap.TryGetValue(colName, out var dbCol))
                {
                    sb.AppendLine($"  [MISSING IN DB] Column '{colName}'");
                    totalDifferences++;
                    continue;
                }

                var dbType = dbCol.GetProperty("DataType").GetString();
                var dbUdt = dbCol.GetProperty("UdtName").GetString();
                var dbNullable = dbCol.GetProperty("IsNullable").GetString() == "YES";
                var dbDefault = dbCol.GetProperty("Default").ValueKind == JsonValueKind.Null ? null : dbCol.GetProperty("Default").GetString();
                int? dbMaxLen = dbCol.GetProperty("MaxLength").ValueKind == JsonValueKind.Null ? null : dbCol.GetProperty("MaxLength").GetInt32();
                int? dbPrec = dbCol.GetProperty("Precision").ValueKind == JsonValueKind.Null ? null : dbCol.GetProperty("Precision").GetInt32();
                int? dbScale = dbCol.GetProperty("Scale").ValueKind == JsonValueKind.Null ? null : dbCol.GetProperty("Scale").GetInt32();

                var efType = efProp.GetColumnType();
                var efNullable = efProp.IsNullable;
                var efMaxLen = efProp.GetMaxLength();
                var efPrec = efProp.GetPrecision();
                var efScale = efProp.GetScale();
                var efDefSql = efProp.GetDefaultValueSql();

                var diffs = new List<string>();

                // Nullability
                if (efNullable != dbNullable)
                {
                    diffs.Add($"Nullable: EF={efNullable} vs DB={dbNullable}");
                    totalDifferences++;
                }

                // Type check
                bool typeCompatible = false;
                if (efType == "uuid" && dbUdt == "uuid") typeCompatible = true;
                else if (efType == "text" && dbUdt == "text") typeCompatible = true;
                else if (efType == "boolean" && dbUdt == "bool") typeCompatible = true;
                else if (efType == "integer" && dbUdt == "int4") typeCompatible = true;
                else if (efType == "timestamp with time zone" && (dbUdt == "timestamptz" || dbType == "timestamp with time zone")) typeCompatible = true;
                else if (efType.StartsWith("double precision") && (dbUdt == "float8" || dbType == "double precision")) typeCompatible = true;
                else if (efType.StartsWith("numeric") && dbType == "numeric")
                {
                    typeCompatible = true;
                    if (efPrec != null && efPrec != dbPrec) { diffs.Add($"Precision: EF={efPrec} vs DB={dbPrec}"); totalDifferences++; }
                    if (efScale != null && efScale != dbScale) { diffs.Add($"Scale: EF={efScale} vs DB={dbScale}"); totalDifferences++; }
                }
                else if (efType.StartsWith("character varying") && dbType == "character varying")
                {
                    typeCompatible = true;
                    if (efMaxLen != null && efMaxLen != dbMaxLen) { diffs.Add($"MaxLength: EF={efMaxLen} vs DB={dbMaxLen}"); totalDifferences++; }
                }
                else if (efType.StartsWith("character varying") && dbType == "text")
                {
                    // EF specifies varchar(N) but DB has text
                    diffs.Add($"Type: EF specifies '{efType}' (max {efMaxLen}), but DB is '{dbType}'");
                    totalDifferences++;
                }
                else
                {
                    diffs.Add($"Type: EF='{efType}' vs DB='{dbType}' (udt: {dbUdt})");
                    totalDifferences++;
                }

                string status = diffs.Count == 0 ? "OK" : "DIFFERENCE: " + string.Join(", ", diffs);
                sb.AppendLine($"  - {colName}: EF=[{efType}, Nullable={efNullable}] | DB=[{dbType}({dbMaxLen ?? dbPrec}), Nullable={dbNullable}, Default={dbDefault ?? "none"}] => {status}");
            }

            // Check extra columns in DB
            foreach (var kvp in dbColMap)
            {
                if (!efPropMap.ContainsKey(kvp.Key))
                {
                    sb.AppendLine($"  [EXTRA IN DB] Column '{kvp.Key}' exists in Supabase but not in EF Core!");
                    totalDifferences++;
                }
            }

            // 2. PRIMARY KEY
            sb.AppendLine("\n--- PRIMARY KEY ---");
            var pk = efEntity.FindPrimaryKey();
            var efPkCols = pk?.Properties.Select(p => p.GetColumnName()).OrderBy(x => x).ToList() ?? new List<string>();
            var dbPkCols = dbConstraintsArray
                .Where(c => c.GetProperty("Type").GetString() == "PRIMARY KEY")
                .Select(c => c.GetProperty("Column").GetString()!)
                .Distinct()
                .OrderBy(x => x)
                .ToList();

            bool pkMatch = efPkCols.SequenceEqual(dbPkCols);
            sb.AppendLine($"  EF PK: [{string.Join(", ", efPkCols)}] | DB PK: [{string.Join(", ", dbPkCols)}] => {(pkMatch ? "OK" : "MISMATCH")}");
            if (!pkMatch) totalDifferences++;

            // 3. FOREIGN KEYS
            sb.AppendLine("\n--- FOREIGN KEYS ---");
            var efFks = efEntity.GetForeignKeys().ToList();
            var dbFkConstraints = dbConstraintsArray
                .Where(c => c.GetProperty("Type").GetString() == "FOREIGN KEY")
                .GroupBy(c => new {
                    Col = c.GetProperty("Column").GetString()!,
                    FTable = c.GetProperty("ForeignTable").GetString()!,
                    FCol = c.GetProperty("ForeignColumn").GetString()!,
                    Del = c.GetProperty("DeleteRule").GetString()!
                })
                .Select(g => g.Key)
                .ToList();

            foreach (var efFk in efFks)
            {
                var depCol = efFk.Properties.First().GetColumnName();
                var fTable = efFk.PrincipalEntityType.GetTableName()!;
                var fCol = efFk.PrincipalKey.Properties.First().GetColumnName();
                var efDel = efFk.DeleteBehavior;
                string expectedDbDel = efDel switch
                {
                    DeleteBehavior.Cascade => "CASCADE",
                    DeleteBehavior.SetNull => "SET NULL",
                    DeleteBehavior.Restrict => "RESTRICT",
                    DeleteBehavior.NoAction => "NO ACTION",
                    _ => "NO ACTION"
                };

                var matched = dbFkConstraints.FirstOrDefault(f => f.Col == depCol && f.FTable == fTable && f.FCol == fCol);
                if (matched == null)
                {
                    sb.AppendLine($"  [MISSING FK IN DB] ({depCol}) -> {fTable}({fCol})");
                    totalDifferences++;
                }
                else
                {
                    bool delMatch = string.Equals(matched.Del, expectedDbDel, StringComparison.OrdinalIgnoreCase);
                    sb.AppendLine($"  - ({depCol}) -> {fTable}({fCol}): DeleteBehavior EF={efDel} ({expectedDbDel}) | DB={matched.Del} => {(delMatch ? "OK" : "DELETE RULE MISMATCH")}");
                    if (!delMatch) totalDifferences++;
                }
            }

            // 4. INDEXES
            sb.AppendLine("\n--- INDEXES ---");
            var efIndexes = efEntity.GetIndexes().ToList();
            var dbIndexList = dbIndexesArray.Select(i => i.GetProperty("IndexName").GetString()!).ToList();

            foreach (var efIdx in efIndexes)
            {
                var idxName = efIdx.GetDatabaseName()!;
                bool exists = dbIndexList.Contains(idxName);
                sb.AppendLine($"  - Index '{idxName}' (Unique={efIdx.IsUnique}, Cols=[{string.Join(", ", efIdx.Properties.Select(p => p.GetColumnName()))}]): {(exists ? "EXISTS IN DB" : "MISSING IN DB")}");
                if (!exists)
                {
                    totalDifferences++;
                }
            }

            sb.AppendLine();
        }

        sb.AppendLine($"================================================================================");
        sb.AppendLine($"TOTAL DIFFERENCES FOUND ACROSS ALL 30 TABLES: {totalDifferences}");
        sb.AppendLine($"================================================================================");

        File.WriteAllText("scratch/per_table_detailed_verification.txt", sb.ToString());
        Console.WriteLine($"Detailed report written to scratch/per_table_detailed_verification.txt. Total differences: {totalDifferences}");
    }
}
