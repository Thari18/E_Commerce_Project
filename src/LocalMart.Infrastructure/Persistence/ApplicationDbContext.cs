using LocalMart.Application.Common.Interfaces;
using LocalMart.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LocalMart.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<VendorApplication> VendorApplications => Set<VendorApplication>();
    public DbSet<Vendor> Vendors => Set<Vendor>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<Inventory> Inventories => Set<Inventory>();
    public DbSet<InventoryLog> InventoryLogs => Set<InventoryLog>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<CustomerAddress> CustomerAddresses => Set<CustomerAddress>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<VendorOrder> VendorOrders => Set<VendorOrder>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();
    public DbSet<DeliveryAssignment> DeliveryAssignments => Set<DeliveryAssignment>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<CouponUsage> CouponUsages => Set<CouponUsage>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<SearchLog> SearchLogs => Set<SearchLog>();
    public DbSet<VendorCommission> VendorCommissions => Set<VendorCommission>();
    public DbSet<VendorPayout> VendorPayouts => Set<VendorPayout>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // UserRole Composite Key
        modelBuilder.Entity<UserRole>(b =>
        {
            b.HasKey(ur => new { ur.UserId, ur.RoleId });
            b.HasOne(ur => ur.User).WithMany(u => u.UserRoles).HasForeignKey(ur => ur.UserId);
            b.HasOne(ur => ur.Role).WithMany(r => r.UserRoles).HasForeignKey(ur => ur.RoleId);
            b.ToTable("user_roles");
        });

        // RolePermission Composite Key
        modelBuilder.Entity<RolePermission>(b =>
        {
            b.HasKey(rp => new { rp.RoleId, rp.PermissionId });
            b.HasOne(rp => rp.Role).WithMany(r => r.RolePermissions).HasForeignKey(rp => rp.RoleId);
            b.HasOne(rp => rp.Permission).WithMany(p => p.RolePermissions).HasForeignKey(rp => rp.PermissionId);
            b.ToTable("role_permissions");
        });

        // Unique Indexes & Decimal Precision
        modelBuilder.Entity<User>(b =>
        {
            b.HasIndex(u => u.Email).IsUnique();
            b.ToTable("users");
        });

        modelBuilder.Entity<Role>(b => b.ToTable("roles"));
        modelBuilder.Entity<Permission>(b => b.ToTable("permissions"));
        modelBuilder.Entity<RefreshToken>(b => b.ToTable("refresh_tokens"));
        modelBuilder.Entity<VendorApplication>(b =>
        {
            b.HasIndex(va => va.Status);
            b.HasIndex(va => va.ApplicantUserId);
            b.HasOne(va => va.ApplicantUser).WithMany().HasForeignKey(va => va.ApplicantUserId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(va => va.ReviewedByAdmin).WithMany().HasForeignKey(va => va.ReviewedByAdminId).OnDelete(DeleteBehavior.SetNull);
            b.ToTable("vendor_applications");
        });

        modelBuilder.Entity<Vendor>(b =>
        {
            b.HasIndex(v => v.UserId).IsUnique();
            b.HasIndex(v => v.ApplicationId).IsUnique();
            b.HasOne(v => v.Application).WithOne().HasForeignKey<Vendor>(v => v.ApplicationId).OnDelete(DeleteBehavior.Restrict);
            b.Property(v => v.CommissionRate).HasPrecision(5, 2);
            b.ToTable("vendors");
        });

        modelBuilder.Entity<Category>(b =>
        {
            b.HasIndex(c => c.Slug).IsUnique();
            b.HasOne(c => c.ParentCategory).WithMany(c => c.SubCategories).HasForeignKey(c => c.ParentCategoryId);
            b.ToTable("categories");
        });

        modelBuilder.Entity<Product>(b =>
        {
            b.HasIndex(p => p.SKU);
            b.HasIndex(p => p.Slug);
            b.Property(p => p.Price).HasPrecision(12, 2);
            b.ToTable("products");
        });

        modelBuilder.Entity<ProductImage>(b => b.ToTable("product_images"));
        modelBuilder.Entity<Inventory>(b => b.ToTable("inventories"));
        modelBuilder.Entity<InventoryLog>(b => b.ToTable("inventory_logs"));

        modelBuilder.Entity<Cart>(b => b.ToTable("carts"));
        modelBuilder.Entity<CartItem>(b =>
        {
            b.Property(ci => ci.UnitPrice).HasPrecision(12, 2);
            b.ToTable("cart_items");
        });

        modelBuilder.Entity<CustomerAddress>(b => b.ToTable("customer_addresses"));

        modelBuilder.Entity<Order>(b =>
        {
            b.HasIndex(o => o.OrderNumber).IsUnique();
            b.Property(o => o.SubTotal).HasPrecision(12, 2);
            b.Property(o => o.DiscountAmount).HasPrecision(12, 2);
            b.Property(o => o.DeliveryFee).HasPrecision(12, 2);
            b.Property(o => o.GrandTotal).HasPrecision(12, 2);
            b.ToTable("orders");
        });

        modelBuilder.Entity<VendorOrder>(b =>
        {
            b.HasIndex(vo => vo.SubOrderNumber).IsUnique();
            b.Property(vo => vo.SubTotal).HasPrecision(12, 2);
            b.Property(vo => vo.CommissionRate).HasPrecision(5, 2);
            b.Property(vo => vo.CommissionAmount).HasPrecision(12, 2);
            b.Property(vo => vo.NetEarnings).HasPrecision(12, 2);
            b.ToTable("vendor_orders");
        });

        modelBuilder.Entity<OrderItem>(b =>
        {
            b.Property(oi => oi.UnitPrice).HasPrecision(12, 2);
            b.Property(oi => oi.TotalPrice).HasPrecision(12, 2);
            b.ToTable("order_items");
        });

        modelBuilder.Entity<Payment>(b =>
        {
            b.Property(p => p.Amount).HasPrecision(12, 2);
            b.ToTable("payments");
        });

        modelBuilder.Entity<PaymentTransaction>(b =>
        {
            b.Property(pt => pt.Amount).HasPrecision(12, 2);
            b.ToTable("payment_transactions");
        });

        modelBuilder.Entity<DeliveryAssignment>(b => b.ToTable("delivery_assignments"));
        modelBuilder.Entity<Review>(b => b.ToTable("reviews"));

        modelBuilder.Entity<Coupon>(b =>
        {
            b.HasIndex(c => c.Code).IsUnique();
            b.Property(c => c.DiscountValue).HasPrecision(12, 2);
            b.Property(c => c.MinOrderAmount).HasPrecision(12, 2);
            b.Property(c => c.MaxDiscountAmount).HasPrecision(12, 2);
            b.ToTable("coupons");
        });

        modelBuilder.Entity<CouponUsage>(b =>
        {
            b.Property(cu => cu.DiscountApplied).HasPrecision(12, 2);
            b.ToTable("coupon_usages");
        });

        modelBuilder.Entity<Notification>(b => b.ToTable("notifications"));
        modelBuilder.Entity<AuditLog>(b => b.ToTable("audit_logs"));
        modelBuilder.Entity<SearchLog>(b => b.ToTable("search_logs"));

        modelBuilder.Entity<VendorCommission>(b =>
        {
            b.Property(vc => vc.CommissionRate).HasPrecision(5, 2);
            b.Property(vc => vc.CommissionAmount).HasPrecision(12, 2);
            b.Property(vc => vc.NetEarnings).HasPrecision(12, 2);
            b.ToTable("vendor_commissions");
        });

        modelBuilder.Entity<VendorPayout>(b =>
        {
            b.Property(vp => vp.Amount).HasPrecision(12, 2);
            b.ToTable("vendor_payouts");
        });
    }
}
