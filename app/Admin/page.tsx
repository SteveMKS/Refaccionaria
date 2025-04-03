'use client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

export default function AddProductPage() {
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Producto agregado",
      description: "El producto se ha registrado correctamente",
    })
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Agregar Nuevo Producto</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Número de Parte</Label>
            <Input required />
          </div>
          <div>
            <Label>Marca</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bosch">Bosch</SelectItem>
                <SelectItem value="acdelco">ACDelco</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Nombre del Producto</Label>
          <Input required />
        </div>

        <div>
          <Label>Descripción</Label>
          <Textarea rows={3} />
        </div>

        <Button type="submit">Guardar Producto</Button>
      </form>
    </div>
  )
}