'use client';

import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, Keyboard, Zoom } from 'swiper/modules';
import Image from 'next/image';
import { Maximize2, X } from 'lucide-react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/zoom';

interface PropertyGalleryProps {
    images: string[];
}

export const PropertyGallery = ({ images }: PropertyGalleryProps) => {
    const [isFullScreen, setIsFullScreen] = useState(false);

    if (!images || images.length === 0) {
        return (
            <div className="h-[70vh] w-full bg-slate-100 flex items-center justify-center">
                <p className="font-serif text-slate-400">Sin imágenes disponibles</p>
            </div>
        );
    }

    const toggleFullScreen = () => setIsFullScreen(!isFullScreen);

    return (
        <>
            <div className="relative h-[80vh] w-full overflow-hidden bg-black group">
                <Swiper
                    modules={[Navigation, Pagination, Autoplay]}
                    navigation
                    pagination={{ clickable: true }}
                    autoplay={{ delay: 5000 }}
                    loop={true}
                    className="h-full w-full"
                >
                    {images.map((img, index) => (
                        <SwiperSlide key={index} onClick={toggleFullScreen} className="cursor-pointer">
                            <div className="relative h-full w-full">
                                <Image
                                    src={img}
                                    alt={`Imagen ${index + 1}`}
                                    fill
                                    className="object-contain"
                                    priority={index === 0}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>

                {/* Overlay Minimalista */}
                <div className="absolute bottom-12 left-12 z-10 pointer-events-none">
                    <span className="text-white/60 text-[10px] tracking-[0.4em] uppercase">Galería Exclusiva</span>
                </div>

                {/* Botón Pantalla Completa */}
                <button
                    onClick={toggleFullScreen}
                    className="absolute top-8 right-8 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-full text-white transition-all opacity-0 group-hover:opacity-100 duration-500"
                    aria-label="Pantalla completa"
                >
                    <Maximize2 size={24} />
                </button>
            </div>

            {/* Modal Pantalla Completa */}
            {isFullScreen && (
                <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center animate-fadeIn">
                    <button
                        onClick={toggleFullScreen}
                        className="absolute top-6 right-6 z-50 text-white/70 hover:text-white transition-colors"
                        aria-label="Cerrar"
                    >
                        <X size={40} strokeWidth={1} />
                    </button>

                    <Swiper
                        modules={[Navigation, Pagination, Keyboard]}
                        navigation
                        pagination={{
                            type: 'fraction',
                            modifierClass: 'swiper-pagination-custom-',
                            renderFraction: function (currentClass, totalClass) {
                                return '<span class="' + currentClass + '"></span> / <span class="' + totalClass + '"></span>';
                            }
                        }}
                        keyboard={{ enabled: true }}
                        loop={true}
                        className="h-full w-full"
                    >
                        {images.map((img, index) => (
                            <SwiperSlide key={index} className="flex items-center justify-center bg-black">
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <img
                                        src={img}
                                        alt={`Full screen ${index}`}
                                        className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl"
                                    />
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    <style jsx global>{`
                        .swiper-pagination-fraction {
                            color: white;
                            font-family: serif;
                            bottom: 2rem;
                            letter-spacing: 0.1em;
                        }
                    `}</style>
                </div>
            )}
        </>
    );
};
