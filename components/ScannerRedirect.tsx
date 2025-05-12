"use client";

import React, { useState, useEffect } from "react";
import { Loader2, QrCode, CheckCircle, AlertCircle } from "lucide-react";

// Definimos interfaces para mejorar el tipado
interface ToastProps {
  message: string;
  type: 'error' | 'success';
}

export default function ScannerRedirect() {
  const [value, setValue] = useState<string>("");
  const [scanning, setScanning] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Efecto para crear la animación de escaneo
  useEffect(() => {
    if (scanning) {
      const timer = setTimeout(() => {
        setScanning(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [scanning]);

  // Resetear éxito después de mostrar
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Resetear error después de mostrar
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      const trimmed = value.trim();

      if (trimmed.length > 0) {
        setScanning(true);
        
        // Simular proceso de escaneo
        setTimeout(() => {
          // Eliminar todos los caracteres no hexadecimales
          const onlyHex = trimmed.replace(/[^a-fA-F0-9]/g, "");

          // Formatear el UUID con guiones
          const formattedUUID = onlyHex.match(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/) 
            ? onlyHex.replace(
                /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
                "$1-$2-$3-$4-$5"
              )
            : onlyHex;

          if (isValidUUID(formattedUUID)) {
            setSuccess(true);
            setTimeout(() => {
              // En lugar de usar next/router, usamos window.location
              window.location.href = `/recibos/${formattedUUID}`;
            }, 800);
          } else {
            setError(true);
            setErrorMessage("Código escaneado no válido");
            console.error("UUID no válido:", trimmed);
          }
          
          setValue(""); // Limpiar campo
          setScanning(false);
        }, 1000);
      }
    }
  };

  const handleFocus = (): void => {
    setScanning(true);
  };

  const isValidUUID = (id: string): boolean => {
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidPattern.test(id);
  };

  // Componente Toast personalizado para reemplazar sonner
  const Toast = ({ message, type }: ToastProps): React.ReactElement => {
    return (
      <div className={`fixed bottom-4 right-4 max-w-md px-6 py-3 rounded-lg shadow-lg 
        ${type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}
        transition-opacity duration-300 flex items-center gap-2`}>
        {type === 'error' ? (
          <AlertCircle size={20} />
        ) : (
          <CheckCircle size={20} />
        )}
        <span>{message}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden transition-all duration-300 transform hover:scale-105">
          <div className="p-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <QrCode size={64} className="text-blue-500 dark:text-blue-400" />
                {scanning && (
                  <div className="absolute inset-0 bg-blue-500/20 animate-pulse rounded-md"></div>
                )}
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-6">
              Escáner de Recibos
            </h2>
            
            <div className={`relative transition-all duration-300 ${scanning ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
              <input
                type="text"
                value={value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
                onKeyDown={handleSubmit}
                onFocus={handleFocus}
                onBlur={() => setScanning(false)}
                placeholder="Escanea o escribe el código"
                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all duration-300"
                autoFocus
              />
              
              {scanning && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 overflow-hidden">
                  <div className="h-full bg-blue-500 animate-scan"></div>
                </div>
              )}
              
              <style jsx>{`
                @keyframes scan {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(100%); }
                }
                .animate-scan {
                  animation: scan 1.5s ease-in-out infinite;
                }
              `}</style>
              
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                {scanning && <Loader2 className="animate-spin text-blue-500" size={24} />}
                {success && <CheckCircle className="text-green-500" size={24} />}
              </div>
            </div>
            
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-4 text-center">
              Escanea un código QR o ingresa un UUID válido
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Sistema de Gestión de Recibos
              </div>
              <div className="text-xs text-blue-500 dark:text-blue-400">
                v1.0.0
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mostrar notificaciones personalizadas en lugar de usar sonner */}
      {error && <Toast message={errorMessage} type="error" />}
      {success && <Toast message="Redirigiendo..." type="success" />}
    </div>
  );
}
/*"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ScannerRedirect() {
  const [value, setValue] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const trimmed = value.trim();

      if (trimmed.length > 0) {
        // Eliminar todos los caracteres no hexadecimales
        const onlyHex = trimmed.replace(/[^a-fA-F0-9]/g, "");

        // Formatear el UUID con guiones
        const formattedUUID = onlyHex.replace(
          /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
          "$1-$2-$3-$4-$5"
        );

        if (isValidUUID(formattedUUID)) {
          router.push(`/recibos/${formattedUUID}`);
        } else {
          toast.error("Código escaneado no válido");
          console.error("UUID no válido:", trimmed);
        }
      }

      setValue(""); // Limpiar campo
    }
  };

  const isValidUUID = (id: string) => {
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidPattern.test(id);
  };

  return (
    <div className="w-full flex justify-center mt-10">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleSubmit}
        placeholder="Escanea o escribe el código"
        className="border px-4 py-2 rounded-md w-[400px] shadow"
        autoFocus
      />
    </div>
  );
}*/