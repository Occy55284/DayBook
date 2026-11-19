import Image from "next/image";

// The Daybook logo and name, shown at the top of every signed-in screen.
export default function BrandHeader() {
  return (
    <header className="brand">
      <Image src="/logo-mark.png" alt="" width={52} height={52} priority />
      <span className="brand-name">
        Day<span>book</span>
      </span>
    </header>
  );
}
