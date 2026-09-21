using System;

namespace DbVerifier;

class Program
{
    static void Main(string[] args)
    {
        LiveCheck.RunPreCheckAsync().GetAwaiter().GetResult();
    }
}
