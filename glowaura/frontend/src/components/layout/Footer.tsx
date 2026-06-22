import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#2c2c2c] text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-serif font-bold text-[#c4a35a] mb-4">GlowAura</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Premium skincare crafted from nature's finest ingredients. Your radiance, our passion.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 uppercase tracking-wider text-sm">Shop</h4>
            <ul className="space-y-2 text-sm">
              {[['All Products','/shop'],['New Arrivals','/shop?new=true'],['Bestsellers','/shop?bestseller=true'],['Serums','/shop?cat=serums'],['Moisturisers','/shop?cat=moisturisers']].map(([l,h])=>(
                <li key={h}><Link href={h} className="text-gray-400 hover:text-[#c4a35a] transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 uppercase tracking-wider text-sm">Company</h4>
            <ul className="space-y-2 text-sm">
              {[['About Us','/about'],['Blog','/blog'],['Contact','/contact'],['Careers','/careers'],['Press','/press']].map(([l,h])=>(
                <li key={h}><Link href={h} className="text-gray-400 hover:text-[#c4a35a] transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 uppercase tracking-wider text-sm">Support</h4>
            <ul className="space-y-2 text-sm">
              {[['Track Order','/user/orders'],['Returns Policy','/returns'],['Shipping Info','/shipping'],['Privacy Policy','/privacy'],['Terms','/terms']].map(([l,h])=>(
                <li key={h}><Link href={h} className="text-gray-400 hover:text-[#c4a35a] transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} GlowAura. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            {['Instagram','Facebook','Twitter','YouTube'].map((s)=>(
              <a key={s} href="#" className="hover:text-[#c4a35a] transition-colors">{s}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
