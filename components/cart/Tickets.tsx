"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import JsBarcode from "jsbarcode";
import { useUser } from "@supabase/auth-helpers-react";

interface Producto {
  name: string;
  quantity: number;
  price: number;
}

interface TicketModalProps {
  open: boolean;
  onClose: () => void;
  productos: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    imagen_principal?: string;
    descripcion?: string;
  }[];
  total: number;
  fecha: string;
  hora: string;
  cliente: string;
  ticketId: string;
  metodoPago: string;
}

export const TicketModal = ({
  open,
  onClose,
  productos,
  total,
  fecha,
  hora,
  cliente,
  ticketId,
  metodoPago,
}: TicketModalProps) => {
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null);
  const [pdfUri, setPdfUri] = useState<string>("");
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const user = useUser();

  useEffect(() => {
    if (open && ticketId) {
      // Convertir el UUID al formato correcto (reemplazar guiones por comillas simples)
      
      // Generar código de barras con el ID formateado
      JsBarcode(barcodeCanvasRef.current, ticketId, {
        format: "CODE128",
        width: 1.5,
        height: 30,
        displayValue: false,
      });
      
      const doc = generarTicket(ticketId); // Usar el ID original para el texto
      const uri = doc.output("datauristring");
      setPdfDoc(doc);
      setPdfUri(uri);
    } else {
      setPdfDoc(null);
      setPdfUri("");
    }
  }, [open, ticketId]);

  const generarTicket = (ticket_id: string) => {
    const baseHeight = 100; // Aumentado para espacio del código de barras
    const extraHeightPerProduct = 10;
    const totalHeight = baseHeight + productos.length * extraHeightPerProduct;
  
    const doc = new jsPDF({ unit: "mm", format: [100, totalHeight] });
    doc.setFont("helvetica");
  
    const margin = { left: 5, right: 5, top: 10 };
    const cols = {
      producto: margin.left,
      cantidad: 40,
      precio: 55,
      total: 85,
    };
    const lineHeight = 5;
    const rowPadding = 4;
  
    let y = margin.top;
  
    // 2. Encabezado
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("**** RECIBO DE COMPRA ****", 50, y, { align: "center" });
    y += 8;
  
    // 3. Información del ticket
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
   
    // y += 6;
    doc.text(`Fecha: ${fecha}`, margin.left, y);
    doc.text(`Hora: ${hora}`, margin.left + 60, y); // Desplazar "Hora" a la derecha
    y += 6;
    doc.text(`Cliente: ${cliente}`, margin.left, y);
    doc.text(`Método: ${metodoPago}`, margin.left + 60, y); // Desplazar "Método" a la derecha
    y += 8;    
  
    // 4. Tabla de productos
    doc.line(margin.left, y, 100 - margin.right, y);
    y += rowPadding + 2;
  
    doc.setFont("helvetica", "bold");
    doc.text("Producto", cols.producto, y);
    doc.text("Cant", cols.cantidad, y, { align: "center" });
    doc.text("P.Unit", cols.precio, y, { align: "center" });
    doc.text("Total", cols.total, y, { align: "right" });
    y += lineHeight;
  
    doc.setFont("helvetica", "normal");
    doc.line(margin.left, y, 100 - margin.right, y);
    y += rowPadding;
  
    productos.forEach((item) => {
      const startY = y;
      const productLines = doc.splitTextToSize(item.name, 30);
  
      productLines.forEach((line: string, i: number) => {
        doc.text(line, cols.producto, y + i * lineHeight);
      });
  
      const productHeight = Math.max(productLines.length * lineHeight, lineHeight);
      const centerY = startY + productHeight / 2 - 2;
  
      doc.text(`${item.quantity}`, cols.cantidad, centerY, { align: "center" });
      doc.text(`$${item.price.toFixed(2)}`, cols.precio, centerY, { align: "center" });
      const subtotal = (item.price * item.quantity).toFixed(2);
      doc.text(`$${subtotal}`, cols.total, centerY, { align: "right" });
  
      y = startY + productHeight + rowPadding;
    });
  
    // 5. Total
    doc.line(margin.left, y, 100 - margin.right, y);
    y += rowPadding + 4;
  
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL: $${total.toFixed(2)}`, 50, y, { align: "center" });
    y += 10;
  
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("¡Gracias por su compra!", 50, y, { align: "center" });
  
    y += 8;
  
    // ✅ Ticket ID justo arriba del código de barras
    doc.setFontSize(9);
    doc.text(`Ticket ID: ${ticket_id.substring(0, 8)}`, 50, y, { align: "center" });
    y += 8;
  
    // Código de barras
    const barcodeDataUrl = barcodeCanvasRef.current.toDataURL("image/png");
    doc.addImage(barcodeDataUrl, "PNG", 30, y, 40, 15);
    y += 20;
  
    return doc;
  };  

  const descargarPDF = () => {
    if (!pdfDoc) return;
    pdfDoc.save(`ticket_${ticketId.substring(0, 8)}.pdf`);
  };

  const imprimirPDF = () => {
    if (!pdfUri) return;
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = pdfUri;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.print();
    };
  };

  return (
    open && (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vista previa del Ticket</DialogTitle>
          </DialogHeader>
          {pdfUri && (
            <iframe 
              src={pdfUri} 
              className="w-full h-96 border rounded"
              title="Vista previa del ticket"
            />
          )}
          <div className="flex justify-between gap-2 pt-4">
            <Button variant="outline" onClick={descargarPDF} className="w-full">
              Descargar
            </Button>
            <Button onClick={imprimirPDF} className="w-full">
              Imprimir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  );
};