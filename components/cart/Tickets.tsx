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
      try {
        JsBarcode(barcodeCanvasRef.current, ticketId, {
          format: "CODE128",
          width: 1.5,
          height: 30,
          displayValue: false,
          margin: 0,
          background: "#ffffff",
          lineColor: "#000000",
        });
      } catch (e) {
        // Si falla, dejamos el canvas vacío; generador dibujará un fallback
        console.warn("Fallo al generar código de barras en canvas", e);
      }

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
    // Constantes de layout
    const pageWidth = 100; // mm
    const margin = { left: 5, right: 5, top: 10, bottom: 10 };
    const contentWidth = pageWidth - margin.left - margin.right;
    const cols = {
      producto: margin.left,
      cantidad: 40,
      precio: 55,
      total: 85,
    };
    const lineHeight = 5;
    const rowPadding = 4;
    const headerGap = 8;
    const infoGapLine = 6;
    const infoGapBlock = 8;
    const barcodeH = 20; // mm visibles en el PDF
    const postBarcodeGap = 6;
    const totalBlockGap = 10; // espacio después del total
    const thanksGap = 8;

    // 1) PRE-CÁLCULO DE ALTURA TOTAL
    let y = margin.top;
    // Encabezado
    y += headerGap; // título
    // Info (fecha/hora, cliente/método)
    y += infoGapLine; // fecha/hora
    y += infoGapBlock; // cliente/método
    // Línea superior de tabla + header
    y += rowPadding + 2; // separación + línea
    y += lineHeight; // títulos de columnas
    y += rowPadding; // línea después del header
    // Filas de productos (altura dinámica)
    const fakeDoc = new jsPDF({ unit: "mm", format: [pageWidth, 200] });
    fakeDoc.setFont("helvetica");
    fakeDoc.setFontSize(9);
    productos.forEach((item) => {
      const productLines = fakeDoc.splitTextToSize(item.name, 30);
      const productHeight = Math.max(productLines.length * lineHeight, lineHeight);
      y += productHeight + rowPadding;
    });
    // Espacio para el código de barras inmediatamente bajo productos
    y += barcodeH + postBarcodeGap;
    // Línea + total + gracias
    y += rowPadding + 4; // línea y separación
    y += totalBlockGap; // total
    y += thanksGap; // gracias

    const totalHeight = Math.max(y + margin.bottom, 100); // mínimo 100mm

    // 2) RENDER REAL EN PDF CON ALTURA CALCULADA
    const doc = new jsPDF({ unit: "mm", format: [pageWidth, totalHeight] });
    doc.setFont("helvetica");

    let yy = margin.top;
    // Título
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("**** RECIBO DE COMPRA ****", pageWidth / 2, yy, { align: "center" });
    yy += headerGap;

    // Info
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha: ${fecha}`, margin.left, yy);
    doc.text(`Hora: ${hora}`, margin.left + 60, yy);
    yy += infoGapLine;
    doc.text(`Cliente: ${cliente}`, margin.left, yy);
    doc.text(`Método: ${metodoPago}`, margin.left + 60, yy);
    yy += infoGapBlock;

    // Tabla de productos
    doc.line(margin.left, yy, pageWidth - margin.right, yy);
    yy += rowPadding + 2;
    doc.setFont("helvetica", "bold");
    doc.text("Producto", cols.producto, yy);
    doc.text("Cant", cols.cantidad, yy, { align: "center" });
    doc.text("P.Unit", cols.precio, yy, { align: "center" });
    doc.text("Total", cols.total, yy, { align: "right" });
    yy += lineHeight;
    doc.setFont("helvetica", "normal");
    doc.line(margin.left, yy, pageWidth - margin.right, yy);
    yy += rowPadding;

    productos.forEach((item) => {
      const startY = yy;
      const productLines = doc.splitTextToSize(item.name, 30);
      productLines.forEach((line: string, i: number) => {
        doc.text(line, cols.producto, yy + i * lineHeight);
      });
      const productHeight = Math.max(productLines.length * lineHeight, lineHeight);
      const centerY = startY + productHeight / 2 - 2;
      doc.text(`${item.quantity}`, cols.cantidad, centerY, { align: "center" });
      doc.text(`$${Number(item.price).toFixed(2)}`, cols.precio, centerY, { align: "center" });
      const subtotal = (Number(item.price) * Number(item.quantity)).toFixed(2);
      doc.text(`$${subtotal}`, cols.total, centerY, { align: "right" });
      yy = startY + productHeight + rowPadding;
    });

    // Línea superior para delimitar sección del código de barras
    doc.line(margin.left, yy, pageWidth - margin.right, yy);
    yy += rowPadding;

    // Código de barras justo debajo de productos
    const barcodeDataUrl = (() => {
      try {
        return barcodeCanvasRef.current.toDataURL("image/png");
      } catch {
        return "";
      }
    })();
    if (barcodeDataUrl && barcodeDataUrl.length > 50) {
      const barcodeWidth = contentWidth * 0.9; // 90% del ancho util
      const barcodeX = margin.left + (contentWidth - barcodeWidth) / 2;
      doc.addImage(barcodeDataUrl, "PNG", barcodeX, yy, barcodeWidth, barcodeH);
    } else {
      // Fallback visual si no hay código de barras
      const fbW = contentWidth * 0.9;
      const fbX = margin.left + (contentWidth - fbW) / 2;
      doc.setDrawColor(150);
      doc.rect(fbX, yy, fbW, barcodeH);
      doc.setFontSize(8);
      doc.text(`Ticket: ${ticket_id.substring(0, 8)}`, pageWidth / 2, yy + barcodeH / 2, { align: "center" });
    }
    yy += barcodeH + postBarcodeGap;

    // Línea y Total
    doc.line(margin.left, yy, pageWidth - margin.right, yy);
    yy += rowPadding + 4;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL: $${total.toFixed(2)}`, pageWidth / 2, yy, { align: "center" });
    yy += totalBlockGap;

    // Mensaje de agradecimiento
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("¡Gracias por su compra!", pageWidth / 2, yy, { align: "center" });
    yy += thanksGap;

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
