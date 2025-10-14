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
  const [ticketHeightMm, setTicketHeightMm] = useState<number>(0);
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
      
  const { doc, height } = generarTicket(ticketId); // Usar el ID original para el texto
  const uri = doc.output("datauristring");
  setPdfDoc(doc);
  setPdfUri(uri);
  setTicketHeightMm(height);
    } else {
      setPdfDoc(null);
      setPdfUri("");
    }
  }, [open, ticketId]);

  const generarTicket = (ticket_id: string) => {
    // Configuración básica
    const pageWidth = 100; // mm
    const margin = { left: 5, right: 5, top: 10 };
    const cols = { producto: margin.left, cantidad: 40, precio: 55, total: 85 };
    const lineHeight = 5;
    const rowPadding = 4;

    // 1) Crear un doc temporal para medir alturas (alto grande)
    const tempDoc = new jsPDF({ unit: 'mm', format: [pageWidth, 1000] });
    tempDoc.setFont('helvetica');
    tempDoc.setFontSize(9);

    let yMeasure = margin.top;

    // Encabezado (medición)
    yMeasure += 8; // título
    yMeasure += 8; // info fecha/cliente

    // Tabla header
    yMeasure += rowPadding + 2 + lineHeight + rowPadding;

    // Productos: medir cada uno con splitTextToSize
    productos.forEach((item) => {
      const productLines = tempDoc.splitTextToSize(item.name, 30);
      const productHeight = Math.max(productLines.length * lineHeight, lineHeight);
      yMeasure += productHeight + rowPadding;
    });

    // Total + mensaje + ticket id + barcode space
    yMeasure += 4 + 10 + 8 + 20 + 10; // margen para total, mensaje, id y código

    const totalHeight = Math.max(120, Math.ceil(yMeasure));

    // 2) Crear el documento final con la altura calculada
    const doc = new jsPDF({ unit: 'mm', format: [pageWidth, totalHeight] });
    doc.setFont('helvetica');

    let y = margin.top;

    // Encabezado
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('**** RECIBO DE COMPRA ****', pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Información del ticket
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${fecha}`, margin.left, y);
    doc.text(`Hora: ${hora}`, margin.left + 60, y);
    y += 6;
    doc.text(`Cliente: ${cliente}`, margin.left, y);
    doc.text(`Método: ${metodoPago}`, margin.left + 60, y);
    y += 8;

    // Tabla de productos
    doc.line(margin.left, y, pageWidth - margin.right, y);
    y += rowPadding + 2;

    doc.setFont('helvetica', 'bold');
    doc.text('Producto', cols.producto, y);
    doc.text('Cant', cols.cantidad, y, { align: 'center' });
    doc.text('P.Unit', cols.precio, y, { align: 'center' });
    doc.text('Total', cols.total, y, { align: 'right' });
    y += lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.line(margin.left, y, pageWidth - margin.right, y);
    y += rowPadding;

    productos.forEach((item) => {
      const startY = y;
      const productLines = doc.splitTextToSize(item.name, 30);

      productLines.forEach((line: string, i: number) => {
        doc.text(line, cols.producto, y + i * lineHeight);
      });

      const productHeight = Math.max(productLines.length * lineHeight, lineHeight);
      const centerY = startY + productHeight / 2 - 2;

      doc.text(`${item.quantity}`, cols.cantidad, centerY, { align: 'center' });
      doc.text(`$${item.price.toFixed(2)}`, cols.precio, centerY, { align: 'center' });
      const subtotal = (item.price * item.quantity).toFixed(2);
      doc.text(`$${subtotal}`, cols.total, centerY, { align: 'right' });

      y = startY + productHeight + rowPadding;
    });

    // Total
    doc.line(margin.left, y, pageWidth - margin.right, y);
    y += rowPadding + 4;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: $${total.toFixed(2)}`, pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('¡Gracias por su compra!', pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Ticket ID
    doc.setFontSize(9);
    doc.text(`Ticket ID: ${ticket_id.substring(0, 8)}`, pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Código de barras (asegurar que JsBarcode ya pintó en el canvas)
    try {
      const barcodeDataUrl = barcodeCanvasRef.current.toDataURL('image/png');
      const barcodeHeight = 15; // mm
      const bottomMargin = 8; // mm to keep barcode away from bottom edge
      // Place barcode no lower than totalHeight - bottomMargin - barcodeHeight
      const barcodeY = Math.min(y, totalHeight - bottomMargin - barcodeHeight);
      const safeBarcodeY = Math.max(barcodeY, y - 6); // avoid jumping too far up; allow slight lift
      doc.addImage(barcodeDataUrl, 'PNG', 30, safeBarcodeY, 40, barcodeHeight);
      y = safeBarcodeY + barcodeHeight + 5;
    } catch (err) {
      // Si falla, seguir sin romper
      console.warn('No se pudo crear la imagen del código de barras', err);
    }

    return { doc, height: totalHeight };
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
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Vista previa del Ticket</DialogTitle>
          </DialogHeader>
          {pdfUri ? (
            <div>
              <iframe
                src={pdfUri}
                style={{ width: '100%', height: ticketHeightMm ? `${Math.min(800, Math.round(ticketHeightMm * 3.78))}px` : '520px' }}
                className="w-full border rounded"
                title="Vista previa del ticket"
              />
            </div>
          ) : (
            <div className="py-6 text-center text-muted-foreground">Previsualización no disponible.</div>
          )}

          <div className="flex flex-col md:flex-row justify-between gap-2 pt-4">
            <Button variant="outline" onClick={descargarPDF} className="w-full md:w-1/3">
              Descargar
            </Button>
            <Button onClick={imprimirPDF} className="w-full md:w-1/3">
              Imprimir
            </Button>
            <Button variant="ghost" onClick={onClose} className="w-full md:w-1/3">
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  );
};
