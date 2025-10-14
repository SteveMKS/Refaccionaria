"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Car,
  Wrench,
  ShieldCheck,
  Zap,
  Droplets,
  Disc3,
  ToyBrick,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const MotionLink = motion(Link);

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

export default function HomePage() {
  const categories = [
    {
      name: "Aceites",
      href: "/Categorias/Aceites",
      icon: (
        <Droplets className="h-8 w-8 text-blue-400" />
      ),
    },
    {
      name: "Balatas",
      href: "/Categorias/Balatas",
      icon: <Disc3 className="h-8 w-8 text-blue-400" />,
    },
    {
      name: "Baterías",
      href: "/Categorias/Baterias",
      icon: <Zap className="h-8 w-8 text-blue-400" />,
    },
    {
      name: "Bujías",
      href: "/Categorias/Bujias",
      icon: <Wrench className="h-8 w-8 text-blue-400" />,
    },
    {
      name: "Otros",
      href: "/Categorias/Otros",
      icon: <ToyBrick className="h-8 w-8 text-blue-400" />,
    },
  ];

  const features = [
    {
      name: "Calidad Garantizada",
      description:
        "Solo las mejores marcas y productos para asegurar el rendimiento y la seguridad de tu vehículo.",
      icon: <ShieldCheck className="h-10 w-10 text-white" />,
    },
    {
      name: "Asesoría Experta",
      description:
        "Nuestro equipo está listo para ayudarte a encontrar la pieza exacta que necesitas.",
      icon: <Wrench className="h-10 w-10 text-white" />,
    },
    {
      name: "Amplio Catálogo",
      description:
        "Desde un tornillo hasta un motor completo, tenemos la refacción que buscas.",
      icon: <Car className="h-10 w-10 text-white" />,
    },
  ];

  const brands = [
    { name: "Mobil", logo: "/Mobil.jpg" },
    { name: "Castrol", logo: "/Castrol.jpg" },
    // Agrega más logos aquí
  ];

  return (
    <div className="bg-gray-900 text-white">
      {/* Hero Section */}
      <motion.section
        className="relative min-h-screen flex items-center justify-center text-center overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="absolute inset-0 bg-black opacity-50 z-10"></div>
        <Image
          src="/hero-background.jpg" // Reemplaza con una imagen tuya si la tienes
          alt="Taller mecánico"
          layout="fill"
          objectFit="cover"
          quality={80}
          className="opacity-30"
        />
        <div className="relative z-20 p-4">
          <motion.h1
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 text-shadow-lg"
            variants={fadeIn}
          >
            Refaccionaria{" "}
            <span className="text-blue-400">Frontera</span>
          </motion.h1>
          <motion.p
            className="max-w-2xl mx-auto text-lg md:text-xl text-gray-300 mb-8"
            variants={fadeIn}
          >
            La pieza que buscas, a la velocidad que necesitas. Calidad y
            confianza para tu vehículo.
          </motion.p>
          <motion.div variants={fadeIn}>
            <Button
              asChild
              size="lg"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg"
            >
              <Link href="/Categorias">
                Ver Catálogo{" "}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* Categories Section */}
      <motion.section
        className="py-20 bg-gray-800"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
      >
        <div className="container mx-auto px-4">
          <motion.h2
            className="text-4xl font-bold text-center mb-12"
            variants={fadeIn}
          >
            Explora Nuestras{" "}
            <span className="text-blue-400">Categorías</span>
          </motion.h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {categories.map((category) => (
              <MotionLink
                key={category.name}
                href={category.href}
                className="group"
                variants={fadeIn}
              >
                <div className="bg-gray-900 p-6 rounded-lg text-center transform transition-transform duration-300 hover:scale-105 hover:bg-blue-500/20 border border-transparent hover:border-blue-400">
                  <div className="flex justify-center mb-4">{category.icon}</div>
                  <h3 className="text-xl font-semibold">{category.name}</h3>
                </div>
              </MotionLink>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="py-20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
      >
        <div className="container mx-auto px-4 text-center">
          <motion.h2
            className="text-4xl font-bold mb-4"
            variants={fadeIn}
          >
            ¿Por qué elegirnos?
          </motion.h2>
          <motion.p
            className="text-lg text-gray-400 mb-12 max-w-3xl mx-auto"
            variants={fadeIn}
          >
            En Refaccionaria Frontera, tu confianza es nuestra prioridad. Te
            ofrecemos más que solo partes.
          </motion.p>
          <div className="grid md:grid-cols-3 gap-10">
            {features.map((feature) => (
              <motion.div
                key={feature.name}
                className="bg-gray-800 p-8 rounded-xl shadow-lg"
                variants={fadeIn}
              >
                <div className="bg-blue-500 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.name}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Brands Section */}
      <motion.section
        className="py-20 bg-gray-800"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeIn}
      >
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-400 mb-8">
            Trabajamos con las mejores marcas
          </h2>
          <div className="flex justify-center items-center gap-12 flex-wrap">
            {brands.map((brand) => (
              <motion.div key={brand.name} whileHover={{ scale: 1.1 }}>
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  width={120}
                  height={60}
                  objectFit="contain"
                  className="grayscale hover:grayscale-0 transition-all duration-300"
                />
              </motion.div>
            ))}
            {/* Puedes agregar más logos aquí */}
            <p className="font-bold text-gray-500">y muchas más...</p>
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="py-20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeIn}
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            ¿Listo para encontrar tu refacción?
          </h2>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            Explora nuestro catálogo completo o contáctanos si necesitas ayuda.
            Estamos aquí para servirte.
          </p>
          <div className="flex justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold"
            >
              <Link href="/Categorias">Buscar Piezas</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white font-bold"
            >
              <Link href="/Contacto">Contáctanos</Link>
            </Button>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
