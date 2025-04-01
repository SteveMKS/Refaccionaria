import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Manejo de diferentes métodos HTTP
export async function GET() {
  try {
    const { data, error } = await supabase.from("productos").select("*");
    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { numero_parte, id_subcategoria3, id_marca, id_sku, nombre, descripcion, precio, existencias, imagen_url } = body;

    // Insertar producto en la base de datos
    const { data, error } = await supabase.from("productos").insert([
      {
        numero_parte,
        id_subcategoria3,
        id_marca,
        id_sku,
        nombre,
        descripcion,
        precio,
        existencias,
        imagen_url,
      },
    ]);

    if (error) throw error;

    return NextResponse.json({ message: "Producto agregado exitosamente", data }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
