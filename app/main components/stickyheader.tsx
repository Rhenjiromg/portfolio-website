import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

const StickyHeader = () => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-white shadow-md select-none">
      {" "}
      <div className="mx-auto flex items-center justify-between px-8 py-3">
        {" "}
        {/* Desktop Nav */} <div></div>
        <nav className="hidden md:flex space-x-6">
          {" "}
          <a
            href="#"
            className="text-gray-600 hover:text-blue-500 hover:cursor-pointer"
          >
            {" "}
            Home{" "}
          </a>{" "}
          <a
            href="/projects"
            className="text-gray-600 hover:text-blue-500 hover:cursor-pointer"
          >
            {" "}
            Projects{" "}
          </a>{" "}
          <a
            href="/education"
            className="text-gray-600 hover:text-blue-500 hover:cursor-pointer"
          >
            {" "}
            Education{" "}
          </a>{" "}
          <a
            href="/personal"
            className="text-gray-600 hover:text-blue-500 hover:cursor-pointer"
          >
            {" "}
            Personal{" "}
          </a>{" "}
        </nav>{" "}
        {/* Mobile Menu Button */}{" "}
        <button
          className="md:hidden text-gray-600"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {" "}
          {menuOpen ? <X size={24} /> : <Menu size={24} />}{" "}
        </button>{" "}
      </div>{" "}
      {/* Mobile Menu */}{" "}
      {menuOpen && (
        <nav className="md:hidden bg-white border-t border-gray-200">
          {" "}
          <a
            href="#"
            className="block px-4 py-2 text-gray-600 hover:bg-gray-100"
          >
            {" "}
            Home{" "}
          </a>{" "}
          <a
            href="#"
            className="block px-4 py-2 text-gray-600 hover:bg-gray-100"
          >
            {" "}
            About{" "}
          </a>{" "}
          <a
            href="#"
            className="block px-4 py-2 text-gray-600 hover:bg-gray-100"
          >
            {" "}
            Services{" "}
          </a>{" "}
          <a
            href="#"
            className="block px-4 py-2 text-gray-600 hover:bg-gray-100"
          >
            {" "}
            Contact{" "}
          </a>{" "}
        </nav>
      )}{" "}
    </header>
  );
};

export default StickyHeader;
