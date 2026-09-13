namespace LocalMart.Application.Common.Security;

public static class Permissions
{
    public static class Vendors
    {
        public const string Read = "vendors.read";
        public const string Approve = "vendors.approve";
        public const string Reject = "vendors.reject";
        public const string Status = "vendors.status";
    }

    public static class Products
    {
        public const string Create = "products.create";
        public const string Read = "products.read";
        public const string Update = "products.update";
        public const string Status = "products.status";
    }
}
