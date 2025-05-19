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
      // Generar código de barras con el ID
      JsBarcode(barcodeCanvasRef.current, ticketId, {
        format: "CODE128",
        width: 1.5,
        height: 30,
        displayValue: false,
      });
      
      const doc = generarTicket(ticketId);
      const uri = doc.output("datauristring");
      setPdfDoc(doc);
      setPdfUri(uri);
    } else {
      setPdfDoc(null);
      setPdfUri("");
    }
  }, [open, ticketId, productos, total, fecha, hora, cliente, metodoPago]);

  const calcularAltoDocumento = (): number => {
    // Altura base para elementos fijos (encabezado, información, totales, código de barras)
    const alturaBase = 150; // Aumentada para evitar truncamiento
    
    // Calcular altura necesaria para los productos
    let alturaProductos = 0;
    
    productos.forEach(item => {
      // Estimar cuántas líneas ocupará el nombre del producto
      const longitudPromedioPorLinea = 30; // Caracteres por línea aproximadamente
      const lineasEstimadas = Math.max(1, Math.ceil(item.name.length / longitudPromedioPorLinea));
      const alturaItem = Math.max(lineasEstimadas * 5, 5) + 5; // 5mm por línea + 5mm de padding
      
      alturaProductos += alturaItem;
    });
    
    // Agregar altura adicional si hay muchos productos
    if (productos.length > 5) {
      alturaProductos += productos.length * 3; // Espacio extra por producto
    }
    
    // Agregar altura para la tabla de productos (encabezados y separadores)
    alturaProductos += 25;
    
    return alturaBase + alturaProductos;
  };

const generarTicket = (ticket_id: string) => {
  let tempY = 0;

  const calcularAltoDocumento = (): number => {
    const docTemp = new jsPDF({ unit: "mm", format: [80, 999] });
    const margin = { left: 5, right: 5, top: 10 };
    const pageWidth = 80;
    const cols = {
      producto: margin.left,
      cantidad: 40,
      precio: 53,
      total: 68,
    };
    const lineHeight = 5;
    const rowPadding = 4;

    let y = margin.top;
    y += 6 + 4 + 6 + 5 + 5 + 8; // Encabezado + línea + info + cliente + método + espaciado

    y += rowPadding + lineHeight + rowPadding; // Encabezado de tabla

    for (const item of productos) {
      const productLines = docTemp.splitTextToSize(item.name, 34);
      const productHeight = Math.max(productLines.length * lineHeight, lineHeight);
      y += productHeight + rowPadding + 2;
    }

    y += 8 + 6 + 6 + 15 + 10; // Total + gracias + línea + barcode + espacio

    tempY = y;
    return y;
  };

  const totalHeight = calcularAltoDocumento();
  const doc = new jsPDF({ unit: "mm", format: [80, totalHeight] });
  doc.setFont("helvetica");
  const margin = { left: 5, right: 5, top: 10 };
  const pageWidth = 80;
  const cols = {
    producto: margin.left,
    cantidad: 40,
    precio: 53,
    total: 68,
  };
  const lineHeight = 5;
  const rowPadding = 4;

  let y = margin.top;

  doc.setFontSize(12).setFont("helvetica", "bold");
  doc.text("Frontera", pageWidth / 2, y, { align: "center" });
  y += 6;

  doc.setDrawColor(100, 100, 100);
  doc.line(margin.left, y, pageWidth - margin.right, y);
  y += 4;

  doc.setFontSize(10).setFont("helvetica", "bold");
  doc.text("**** RECIBO DE COMPRA ****", pageWidth / 2, y, { align: "center" });
  y += 6;

  doc.setFontSize(8).setFont("helvetica", "normal");
  doc.text(`Fecha: ${fecha}`, margin.left, y);
  doc.text(`Hora: ${hora}`, pageWidth - margin.right - 25, y);
  y += 5;
  const clienteDisplay = cliente.length > 25 ? cliente.substring(0, 22) + "..." : cliente;
  doc.text(`Cliente: ${clienteDisplay}`, margin.left, y);
  y += 5;
  doc.text(`Método de pago: ${metodoPago}`, margin.left, y);
  y += 8;

  doc.setDrawColor(50, 50, 50);
  doc.line(margin.left, y, pageWidth - margin.right, y);
  y += rowPadding;

  doc.setFont("helvetica", "bold");
  doc.text("Producto", cols.producto, y);
  doc.text("Cant", cols.cantidad, y);
  doc.text("Precio", cols.precio, y);
  doc.text("Total", cols.total, y);
  y += lineHeight;

  doc.setFont("helvetica", "normal");
  doc.setDrawColor(200, 200, 200);
  doc.line(margin.left, y, pageWidth - margin.right, y);
  y += rowPadding;

  let subtotalGeneral = 0;
  productos.forEach((item) => {
    const startY = y;
    const productLines = doc.splitTextToSize(item.name, 34);

    productLines.forEach((line: string, i: number) => {
      doc.text(line, cols.producto, y + i * lineHeight);
    });

    const productHeight = Math.max(productLines.length * lineHeight, lineHeight);
    const centerY = startY + productHeight / 2 - 2;

    const subtotal = item.price * item.quantity;
    subtotalGeneral += subtotal;

    doc.text(`${item.quantity}`, cols.cantidad, centerY);
    doc.text(`$${item.price.toFixed(2)}`, cols.precio, centerY);
    doc.text(`$${subtotal.toFixed(2)}`, cols.total, centerY);

    y = startY + productHeight + rowPadding;

    if (productos.length > 1) {
      doc.setDrawColor(220, 220, 220);
      doc.setLineDashPattern([0.5, 0.5], 0);
      doc.line(margin.left, y - 2, pageWidth - margin.right, y - 2);
      doc.setLineDashPattern([], 0);
    }
  });

  doc.setDrawColor(50, 50, 50);
  doc.line(margin.left, y, pageWidth - margin.right, y);
  y += rowPadding + 2;

  doc.setFontSize(10).setFont("helvetica", "bold");
  doc.text("TOTAL:", cols.precio - 15, y);
  const totalMostrado = Math.abs(total - subtotalGeneral) < 0.01 ? total : subtotalGeneral;
  doc.text(`$${totalMostrado.toFixed(2)}`, cols.total, y);
  y += 8;

  doc.setFontSize(9).setFont("helvetica", "normal");
  doc.text("¡Gracias por su compra!", pageWidth / 2, y, { align: "center" });
  y += 6;

  doc.setDrawColor(100, 100, 100);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin.left, y, pageWidth - margin.right, y);
  doc.setLineDashPattern([], 0);
  y += 6;

  doc.setFontSize(8);
  doc.text(`Ticket ID: ${ticket_id.substring(0, 8)}`, pageWidth / 2, y, { align: "center" });
  y += 6;

  const barcodeDataUrl = barcodeCanvasRef.current.toDataURL("image/png");
  const barcodeWidth = 50;
  const barcodeHeight = 15;
  doc.addImage(barcodeDataUrl, "PNG", (pageWidth - barcodeWidth) / 2, y, barcodeWidth, barcodeHeight);
  y += barcodeHeight + 5;

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
      if (iframe.contentWindow) {
        iframe.contentWindow.print();
        // Eliminar el iframe después de imprimir
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }
    };
  };

  return (
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
  );
};