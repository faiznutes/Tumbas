import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-[#e7edf3] py-12 mt-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="text-primary">
              <span className="material-symbols-outlined text-2xl">shopping_bag</span>
            </div>
            <span className="text-lg font-bold">Tumbas</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-[#4c739a]">
            <Link
              href="/about"
              className="hover:text-[#137fec] transition-colors"
            >
              About
            </Link>
            <Link
              href="/faq"
              className="hover:text-[#137fec] transition-colors"
            >
              FAQ
            </Link>
            <Link
              href="/terms"
              className="hover:text-[#137fec] transition-colors"
            >
              Terms & Conditions
            </Link>
            <Link
              href="/privacy"
              className="hover:text-[#137fec] transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/contact"
              className="hover:text-[#137fec] transition-colors"
            >
              Contact
            </Link>
          </div>

          <div className="text-sm text-[#4c739a] text-center md:text-right">
            <p>&copy; {currentYear} Tumbas Inc. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
