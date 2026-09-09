import { useApp } from '../AppContext';
import BrandLine from './BrandLine';
import Marquee from 'react-fast-marquee';

const placeholderLogos = [
    { id: 1, name: 'Brand 1', logo: '/images/brands/2-1 1.png' },
    { id: 2, name: 'Brand 2', logo: '/images/brands/3-1 1.png' },
    { id: 3, name: 'Brand 3', logo: '/images/brands/4-1 1.png' },
    { id: 4, name: 'Brand 4', logo: '/images/brands/5-1 1.png' },
    { id: 5, name: 'Brand 5', logo: '/images/brands/6-1 1.png' },
    { id: 6, name: 'Brand 6', logo: '/images/brands/7-1 1.png' }
];

export default function BrandPartnerSection() {
    const { configs } = useApp();
    
    let brandLogos = [];
    try {
        if (configs && configs.brand_logos) {
            brandLogos = JSON.parse(configs.brand_logos);
        }
    } catch (e) {
        console.error("Error parsing brand logos:", e);
    }

    const displayLogos = brandLogos.map((url, index) => ({ id: index, name: `Brand ${index + 1}`, logo: url }));
    const MarqueeComponent = Marquee.default || Marquee;
    
    let marqueeItems = [...displayLogos];
    if (marqueeItems.length > 0) {
        while (marqueeItems.length < 15) {
            marqueeItems = [...marqueeItems, ...displayLogos];
        }
    }
    
    return (
        <div className="w-full pt-8 mt-2 max-w-7xl mx-auto bg-transparent flex flex-col items-center">
            {/* Brand Line Divider */}
            <div className="mb-12 w-full">
                <BrandLine />
            </div>

            <section className="w-full text-left">
                {/* Two Column Grid for Title and Story */}
                <div className="flex flex-col md:flex-row gap-6 md:gap-12 mb-6 justify-between items-start">
                    {/* Left Title */}
                    <div className="w-full md:w-[32%] shrink-0 text-left">
                        <span className="text-neutral-400 text-xs font-normal tracking-wide block mb-3 uppercase">
                            FYI, We Supply
                        </span>
                        <h2 className="text-[#8e5233] leading-snug">
                            <span className="block text-2xl md:text-[28px] font-light font-serif">Where dreams</span>
                            <span className="block text-3xl md:text-[38px] font-bold font-serif">Meet Cream</span>
                        </h2>
                    </div>
                    
                    {/* Right Story Text */}
                    <div className="w-full md:w-[68%] flex flex-col justify-end text-neutral-500 text-xs md:text-sm font-light leading-relaxed space-y-4 text-left">
                        <p>
                            What started as a food blog in 2013 has blossomed into London’s most beloved dessert destination.
                        </p>
                        <p>
                            During Ramadan 2020, our founder’s love for creamy, Middle Eastern-inspired desserts and countless hours of lockdown experimentation gave birth to something extraordinary – our signature Malai cake, now known as the legendary Cream Cake.
                        </p>
                    </div>
                </div>

                {/* Sliding Logo Container */}
                {brandLogos && brandLogos.length > 0 && (
                    <div className="w-full mt-8 overflow-hidden py-4">
                        <MarqueeComponent 
                            speed={25} 
                            gradient={false} 
                            pauseOnHover={true}
                            direction="left"
                        >
                            {marqueeItems.map((logo, index) => (
                                <div key={index} className="mx-12 md:mx-16 flex items-center justify-center shrink-0">
                                    <img 
                                        src={logo.logo} 
                                        alt={logo.name} 
                                        className="h-14 md:h-18 w-auto object-contain opacity-75 hover:opacity-100 transition-all duration-300"
                                    />
                                </div>
                            ))}
                        </MarqueeComponent>
                    </div>
                )}
            </section>
        </div>
    );
}
